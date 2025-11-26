const { Task, Project, Label, TaskAssignment, User, Participant, Event, TaskComment } = require('../../infrastructure/database/models');
const { getIO } = require('../../infrastructure/external-services/services/socket');
const { Op } = require('sequelize');
const { checkBusinessTripConflict } = require('../../infrastructure/external-services/services/business-trip-validator');

// Helper function to auto-update task status based on assignments progress
async function autoUpdateTaskStatus(taskId) {
  try {
    const task = await Task.findByPk(taskId, { include: [{ model: TaskAssignment, as: 'assignments' }] });
    if (!task) return;
    
    const assignments = task.assignments || [];
    const total = assignments.length;
    
    if (total === 0) {
      // No assignments, keep current status
      return;
    }
    
    const completedCount = assignments.filter(a => a.status === 'completed' || a.progress >= 100).length;
    const anyProgress = assignments.some(a => a.progress > 0);
    
    let newStatus = 'todo'; // default
    if (completedCount === total) {
      newStatus = 'completed';
    } else if (anyProgress) {
      newStatus = 'in_progress';
    }
    
    if (task.status !== newStatus) {
      task.status = newStatus;
      await task.save();
      try { getIO().emit('dataUpdated', { resource: 'tasks', action: 'status', id: task.id, status: newStatus }); } catch (_) {}
      console.log(`Task ${taskId} status auto-updated to ${newStatus}`);
    }
  } catch (error) {
    console.error('Error auto-updating task status:', error);
  }
}

function computeEffectiveWeights(tasks) {
  // tasks: array of { id, weight }
  const explicit = tasks.filter(t => typeof t.weight === 'number' && t.weight !== null);
  const auto = tasks.filter(t => t.weight === null || typeof t.weight === 'undefined');
  const sumExplicit = explicit.reduce((a,b)=> a + (b.weight||0), 0);
  let remaining = 100 - sumExplicit;
  if (remaining < 0) remaining = 0; // quá 100 thì phần còn lại = 0
  const result = {};
  explicit.forEach(t => { result[t.id] = t.weight; });
  if (auto.length) {
    const base = Math.floor(remaining / auto.length);
    let rem = remaining % auto.length;
    auto.forEach(t => {
      let w = base;
      if (rem > 0) { w += 1; rem -= 1; }
      result[t.id] = w;
    });
  }
  return result; // id -> effectiveWeight
}

async function listTasks(req, res) {
  try {
    const { id, status, projectId, from, to, limit = 100, offset = 0, scope } = req.query;
    const where = {};
    if (id) where.id = id;
    if (status) where.status = status;
    if (projectId) where.projectId = projectId;
    if (from || to) {
      where.start_time = {};
      if (from) where.start_time[Op.gte] = new Date(from);
      if (to) where.start_time[Op.lte] = new Date(to);
    }
    if (req.user?.role === 'manager' && scope !== 'all') {
      where.departmentId = req.user.departmentId || null;
    }
    const include = [ Project, { model: Label } ];
    if (req.user?.role === 'employee' && scope !== 'all') {
      include.push({ model: TaskAssignment, as: 'assignments', required: true, where: { userId: req.user.id }, include: [{ model: User, attributes: ['id','name'] }] });
    } else {
      include.push({ model: TaskAssignment, as: 'assignments', include: [{ model: User, attributes: ['id','name'] }] });
    }
    const rows = await Task.findAll({
      where,
      include,
      limit: Math.min(Number(limit) || 100, 500),
      offset: Number(offset) || 0,
      order: [['created_at','DESC']]
    });
    // Tính effective weight theo từng project
    const byProject = {};
    rows.forEach(r => {
      const pid = r.projectId || '__no_project__';
      if (!byProject[pid]) byProject[pid] = [];
      byProject[pid].push(r);
    });
    const weightMaps = {};
    Object.entries(byProject).forEach(([pid, arr]) => {
      weightMaps[pid] = computeEffectiveWeights(arr.map(t => ({ id: t.id, weight: t.weight })));
    });
    const json = rows.map(r => {
      const obj = r.toJSON();
      const pid = r.projectId || '__no_project__';
      obj.effectiveWeight = weightMaps[pid][r.id];
      return obj;
    });
    return res.json(json);
  } catch (e) { return res.status(500).json({ message: e.message }); }
}

async function createTask(req, res) {
  try {
    const { title, description, start_time, end_time, status, projectId, priority, labelIds = [], assignment_type = 'open', capacity = 1, departmentId, weight } = req.body;
    if (!title) return res.status(400).json({ message: 'Missing title' });
    if (req.user.role === 'manager' && departmentId && String(departmentId) !== String(req.user.departmentId)) {
      return res.status(403).json({ message: 'Cannot create task for another department' });
    }
    let weightVal = null;
    if (typeof weight === 'number') {
      if (weight < 0 || weight > 100) return res.status(400).json({ message: 'Weight out of range' });
      weightVal = Math.round(weight);
    }
    // Validate tổng trọng số explicit không vượt 100
    if (projectId && weightVal !== null) {
      const siblings = await Task.findAll({ where: { projectId, id: { [Op.ne]: null } }, attributes: ['id','weight'] });
      let usedWeight = 0;
      siblings.forEach(s => { if (s.weight !== null && typeof s.weight === 'number') usedWeight += s.weight; });
      const totalWeight = usedWeight + weightVal;
      if (totalWeight > 100) {
        const remaining = 100 - usedWeight;
        return res.status(400).json({ 
          message: `Trọng số dự án đã vượt quá 100%. Dự án còn lại ${remaining}%`,
          usedWeight,
          remaining,
          requestedWeight: weightVal,
          totalWeight
        });
      }
    }
    const task = await Task.create({ title, description, start_time, end_time, status: status || 'todo', projectId: projectId || null, createdById: req.user.id, priority: priority || 'normal', assignment_type, capacity, departmentId: departmentId || req.user.departmentId || null, weight: weightVal });
    if (Array.isArray(labelIds) && labelIds.length) {
      await task.setLabels(labelIds);
    }
  const created = await Task.findByPk(task.id, { include: [Project, { model: Label }, { model: TaskAssignment, as: 'assignments' }] });
  try { getIO().emit('dataUpdated', { resource: 'tasks', action: 'create', id: created.id }); } catch (_) {}
    return res.status(201).json(created);
  } catch (e) { return res.status(500).json({ message: e.message }); }
}

async function updateTask(req, res) {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Not found' });
    const managerCan = req.user.role === 'manager' && String(task.departmentId) === String(req.user.departmentId);
    if (String(task.createdById) !== String(req.user.id) && !(req.user.role === 'admin' || managerCan)) return res.status(403).json({ message: 'Forbidden' });
    // Manager edit restriction: only allowed before start_time (or end_time fallback)
    if (req.user.role === 'manager' && managerCan) {
      const now = new Date();
      const startBound = task.start_time || task.end_time; // some tasks may only have end_time
      if (startBound && now >= new Date(startBound)) {
        return res.status(400).json({ message: 'Manager cannot edit task after it has started' });
      }
    }
    const { title, description, start_time, end_time, status, projectId, priority, labelIds, assignment_type, capacity, weight } = req.body;
    if (title) task.title = title;
    if (typeof description !== 'undefined') task.description = description;
    if (start_time) task.start_time = start_time;
    if (end_time) task.end_time = end_time;
    if (status) task.status = status;
    if (typeof projectId !== 'undefined') task.projectId = projectId;
    if (priority) task.priority = priority;
    if (assignment_type) task.assignment_type = assignment_type;
    if (typeof capacity !== 'undefined') task.capacity = capacity;
    if (typeof weight !== 'undefined') {
      if (weight === null || weight === '') {
        task.weight = null;
      } else if (typeof weight === 'number') {
        if (weight < 0 || weight > 100) return res.status(400).json({ message: 'Weight out of range' });
        task.weight = Math.round(weight);
      }
    }
    // Sau khi gán weight mới, kiểm tra tổng trọng số explicit
    if (task.projectId && task.weight !== null) {
      const siblings = await Task.findAll({ where: { projectId: task.projectId, id: { [Op.ne]: task.id } }, attributes: ['id','weight'] });
      let usedWeight = 0;
      siblings.forEach(s => { if (s.weight !== null && typeof s.weight === 'number') usedWeight += s.weight; });
      const totalWeight = usedWeight + task.weight;
      if (totalWeight > 100) {
        const remaining = 100 - usedWeight;
        return res.status(400).json({ 
          message: `Trọng số dự án đã vượt quá 100%. Dự án còn lại ${remaining}%`,
          usedWeight,
          remaining,
          requestedWeight: task.weight,
          totalWeight
        });
      }
    }
    await task.save();
    if (Array.isArray(labelIds)) await task.setLabels(labelIds);
  const updated = await Task.findByPk(task.id, { include: [Project, { model: Label }, { model: TaskAssignment, as: 'assignments' }] });
  try { getIO().emit('dataUpdated', { resource: 'tasks', action: 'update', id: updated.id }); } catch (_) {}
    // Notify assigned users about update
    try {
      const asgs = await TaskAssignment.findAll({ where: { taskId: task.id }, attributes: ['userId'] });
      const ids = asgs.map(a => a.userId);
      if (ids.length) {
        const { notifyUsers } = require('../../infrastructure/external-services/services/notification.service');
        await notifyUsers(ids, 'Cập nhật nhiệm vụ', `Nhiệm vụ ${task.title} đã được cập nhật`, { ref_type: 'task', ref_id: task.id });
      }
    } catch (_) {}
    return res.json(updated);
  } catch (e) { return res.status(500).json({ message: e.message }); }
}

async function deleteTask(req, res) {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Not found' });
    const managerCan = req.user.role === 'manager' && String(task.departmentId) === String(req.user.departmentId);
    if (String(task.createdById) !== String(req.user.id) && !(req.user.role === 'admin' || managerCan)) return res.status(403).json({ message: 'Forbidden' });
    // Manager delete restriction: only before start
    if (req.user.role === 'manager' && managerCan) {
      const now = new Date();
      const startBound = task.start_time || task.end_time;
      if (startBound && now >= new Date(startBound)) {
        return res.status(400).json({ message: 'Manager cannot delete task after it has started' });
      }
    }
    // Collect assigned userIds for notification before destroy
    let assignedIds = [];
    try {
      const asgs = await TaskAssignment.findAll({ where: { taskId: task.id }, attributes: ['userId'] });
      assignedIds = asgs.map(a => a.userId);
    } catch (_) {}
  await task.destroy();
  try { getIO().emit('dataUpdated', { resource: 'tasks', action: 'delete', id: task.id }); } catch (_) {}
    // Notify assigned users that task was deleted
    if (assignedIds.length) {
      try {
        const { notifyUsers } = require('../../infrastructure/external-services/services/notification.service');
        await notifyUsers(assignedIds, 'Nhiệm vụ bị xóa', `Nhiệm vụ ${task.title} đã bị xóa`, { ref_type: 'task', ref_id: task.id });
      } catch (_) {}
    }
    return res.json({ message: 'Deleted' });
  } catch (e) { return res.status(500).json({ message: e.message }); }
}

async function stats(req, res) {
  try {
    const where = {};
    const scope = req.query.scope || (req.user.role === 'admin' ? 'all' : req.user.role === 'manager' ? 'department' : 'me');
    if (scope === 'department' && req.user.departmentId) {
      where.departmentId = req.user.departmentId;
    }
    if (scope === 'me') {
      const assigns = await TaskAssignment.findAll({ where: { userId: req.user.id }, attributes: ['taskId'] });
      const ids = assigns.map(a => a.taskId);
      if (!ids.length) return res.json({ todo:0,in_progress:0,completed:0 });
      where.id = ids;
    }
    const rows = await Task.findAll({ attributes: ['status', [Task.sequelize.fn('COUNT', Task.sequelize.col('id')),'count']], where, group: ['status'] });
    const map = { todo:0,in_progress:0,completed:0 };
    rows.forEach(r=> map[r.status] = Number(r.get('count')) );
    return res.json(map);
  } catch (e) { return res.status(500).json({ message: e.message }); }
}

// ===== Assignments APIs =====
async function getAcceptedCount(taskId) {
  return TaskAssignment.count({ where: { taskId, status: { [Op.in]: ['accepted','completed'] } } });
}

async function applyTask(req, res) {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Not found' });
    if (task.assignment_type !== 'open') return res.status(400).json({ message: 'Task is not open for self-apply' });
    const accepted = await getAcceptedCount(task.id);
    if (accepted >= task.capacity) return res.status(409).json({ message: 'Task is full' });
    const exists = await TaskAssignment.findOne({ where: { taskId: task.id, userId: req.user.id } });
    if (exists) return res.status(400).json({ message: 'Already applied or assigned' });
  const asg = await TaskAssignment.create({ taskId: task.id, userId: req.user.id, status: 'accepted' });
  
  // Auto update task status after new assignment
  await autoUpdateTaskStatus(task.id);
  
  try { getIO().emit('dataUpdated', { resource: 'tasks', action: 'assign', id: task.id }); } catch (_) {}
  return res.status(201).json(asg);
  } catch (e) { return res.status(500).json({ message: e.message }); }
}

async function assignTask(req, res) {
  try {
    if (!(req.user.role === 'manager' || req.user.role === 'admin')) return res.status(403).json({ message: 'Forbidden' });
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Not found' });
    if (req.user.role === 'manager' && String(task.departmentId) !== String(req.user.departmentId)) return res.status(403).json({ message: 'Cross-department not allowed' });
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'Missing userId' });
    // Check for business trip conflicts
    // Use dueDate if available, otherwise use start_time/end_time range
    let checkStart = task.dueDate || task.start_time;
    let checkEnd = task.dueDate || task.end_time;
    
    if (checkStart) {
      const conflict = await checkBusinessTripConflict(userId, checkStart, checkEnd);
      if (conflict.hasConflict) {
        return res.status(409).json({ message: conflict.message });
      }
    }
    const accepted = await getAcceptedCount(task.id);
    if (accepted >= task.capacity) return res.status(409).json({ message: 'Task is full' });
    const exists = await TaskAssignment.findOne({ where: { taskId: task.id, userId } });
    if (exists) return res.status(400).json({ message: 'Already applied or assigned' });
    const status = task.assignment_type === 'direct' ? 'assigned' : 'accepted';
  const asg = await TaskAssignment.create({ taskId: task.id, userId, status });
  
  // Auto update task status after new assignment
  await autoUpdateTaskStatus(task.id);
  
    try { require('../../infrastructure/external-services/services/notification.service').notifyUsers(userId, 'Nhiệm vụ mới', task.title, { ref_type: 'task', ref_id: task.id }); } catch (_) {}
  try { getIO().emit('dataUpdated', { resource: 'tasks', action: 'assign', id: task.id }); } catch (_) {}
  return res.status(201).json(asg);
  } catch (e) { return res.status(500).json({ message: e.message }); }
}
async function rejectTask(req, res) {
  try {
    const { reason } = req.body;
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Not found' });
    const asg = await TaskAssignment.findOne({ where: { taskId: task.id, userId: req.user.id } });
    if (!asg) return res.status(404).json({ message: 'Assignment not found' });
    if (asg.status === 'completed') return res.status(400).json({ message: 'Already completed' });
    asg.status = 'rejected';
    if (reason) asg.reject_reason = String(reason).slice(0, 1000);
    await asg.save();
    // Notify managers with reason
    try {
      const mgrs = await User.findAll({ where: { role: 'manager', departmentId: task.departmentId }, attributes: ['id'] });
      const ids = mgrs.length ? mgrs.map(m => m.id) : (task.createdById ? [task.createdById] : []);
      if (ids.length) {
        const me = await User.findByPk(req.user.id, { attributes: ['name','email'] });
        const who = me?.name || me?.email || 'Một nhân viên';
        const msg = reason ? `${who} từ chối: ${task.title} — Lý do: ${reason}` : `${who} từ chối: ${task.title}`;
        await require('../../infrastructure/external-services/services/notification.service').notifyUsers(ids, 'Từ chối nhiệm vụ', msg, { ref_type: 'task', ref_id: task.id });
      }
    } catch (_) {}
    try { getIO().emit('dataUpdated', { resource: 'tasks', action: 'reject', id: task.id }); } catch (_) {}
    return res.json(asg);
  } catch (e) { return res.status(500).json({ message: e.message }); }
}

// Manager/Admin approves an employee's rejection. If userId provided, target that user; otherwise all rejected.
async function approveRejection(req, res) {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Not found' });
    const isManager = req.user.role === 'manager' && String(task.departmentId) === String(req.user.departmentId);
    if (!(req.user.role === 'admin' || isManager)) return res.status(403).json({ message: 'Forbidden' });
    const { userId } = req.body || {};
    const where = { taskId: task.id, status: 'rejected' };
    if (userId) where.userId = userId;
    const asgs = await TaskAssignment.findAll({ where });
    if (!asgs.length) return res.status(404).json({ message: 'No rejected assignments' });
    const affectedUserIds = asgs.map(a => a.userId);
    for (const a of asgs) await a.destroy();
    try {
      await require('../../infrastructure/external-services/services/notification.service').notifyUsers(affectedUserIds, 'Chấp thuận từ chối', `Quản lý đã chấp thuận yêu cầu từ chối cho nhiệm vụ: ${task.title}`, { ref_type: 'task', ref_id: task.id });
    } catch (_) {}
    try { getIO().emit('dataUpdated', { resource: 'tasks', action: 'approve-reject', id: task.id }); } catch (_) {}
    return res.json({ message: 'Approved', count: asgs.length });
  } catch (e) { return res.status(500).json({ message: e.message }); }
}

// Manager/Admin denies an employee's rejection: restore assignment and notify employee(s).
async function denyRejection(req, res) {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Not found' });
    const isManager = req.user.role === 'manager' && String(task.departmentId) === String(req.user.departmentId);
    if (!(req.user.role === 'admin' || isManager)) return res.status(403).json({ message: 'Forbidden' });
    const { userId } = req.body || {};
    const where = { taskId: task.id, status: 'rejected' };
    if (userId) where.userId = userId;
    const asgs = await TaskAssignment.findAll({ where });
    if (!asgs.length) return res.status(404).json({ message: 'No rejected assignments' });
    const newStatus = task.assignment_type === 'direct' ? 'assigned' : 'accepted';
    for (const a of asgs) { a.status = newStatus; await a.save(); }
    
    // Auto update task status after assignment status change
    await autoUpdateTaskStatus(task.id);
    
    try {
      await require('../../infrastructure/external-services/services/notification.service').notifyUsers(asgs.map(a=>a.userId), 'Từ chối không được duyệt', `Quản lý không chấp thuận yêu cầu từ chối. Vui lòng tiếp tục nhiệm vụ: ${task.title}`, { ref_type: 'task', ref_id: task.id });
    } catch (_) {}
    try { getIO().emit('dataUpdated', { resource: 'tasks', action: 'deny-reject', id: task.id }); } catch (_) {}
    return res.json({ message: 'Denied', count: asgs.length });
  } catch (e) { return res.status(500).json({ message: e.message }); }
}

async function acceptTask(req, res) {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Not found' });
    const asg = await TaskAssignment.findOne({ where: { taskId: task.id, userId: req.user.id } });
    if (!asg) return res.status(404).json({ message: 'Assignment not found' });
    if (asg.status === 'accepted' || asg.status === 'completed') return res.json(asg);
    const accepted = await getAcceptedCount(task.id);
    if (accepted >= task.capacity) return res.status(409).json({ message: 'Task is full' });
    asg.status = 'accepted';
  await asg.save();
    // Notify managers of this department (or creator as fallback)
    try {
      const mgrs = await User.findAll({ where: { role: 'manager', departmentId: task.departmentId }, attributes: ['id'] });
      const ids = mgrs.length ? mgrs.map(m => m.id) : (task.createdById ? [task.createdById] : []);
      if (ids.length) {
        const me = await User.findByPk(req.user.id, { attributes: ['name','email'] });
        const who = me?.name || me?.email || 'Một nhân viên';
        await require('../../infrastructure/external-services/services/notification.service').notifyUsers(ids, 'Nhận nhiệm vụ', `${who} đã chấp nhận: ${task.title}`, { ref_type: 'task', ref_id: task.id });
      }
    } catch (_) {}
  try { getIO().emit('dataUpdated', { resource: 'tasks', action: 'accept', id: task.id }); } catch (_) {}
  return res.json(asg);
  } catch (e) { return res.status(500).json({ message: e.message }); }
}

async function updateProgress(req, res) {
  try {
    const { progress } = req.body;
    if (typeof progress !== 'number' || progress < 0 || progress > 100) return res.status(400).json({ message: 'Invalid progress' });
    const asg = await TaskAssignment.findOne({ where: { taskId: req.params.id, userId: req.user.id } });
    if (!asg) return res.status(404).json({ message: 'Assignment not found' });
    asg.progress = Math.round(progress);
    if (asg.progress >= 100) asg.status = 'completed';
    await asg.save();

    // Auto update task status based on assignments' progress
    await autoUpdateTaskStatus(req.params.id);
    if (asg.status === 'completed') {
      // Notify managers on completion
      try {
        const task = await Task.findByPk(req.params.id);
        if (task) {
          const mgrs = await User.findAll({ where: { role: 'manager', departmentId: task.departmentId }, attributes: ['id'] });
          const ids = mgrs.length ? mgrs.map(m => m.id) : (task.createdById ? [task.createdById] : []);
          if (ids.length) {
            const me = await User.findByPk(req.user.id, { attributes: ['name','email'] });
            const who = me?.name || me?.email || 'Một nhân viên';
            await require('../../infrastructure/external-services/services/notification.service').notifyUsers(ids, 'Hoàn thành nhiệm vụ', `${who} đã hoàn thành: ${task.title}`, { ref_type: 'task', ref_id: task.id });
          }
        }
      } catch (_) {}
    }
  try { getIO().emit('dataUpdated', { resource: 'tasks', action: 'progress', id: req.params.id }); } catch (_) {}
  return res.json(asg);
  } catch (e) { return res.status(500).json({ message: e.message }); }
}

module.exports = { listTasks, createTask, updateTask, deleteTask, stats, applyTask, assignTask, acceptTask, updateProgress, rejectTask, approveRejection, denyRejection };
// ===== Comments APIs =====
async function listComments(req, res) {
  try {
    const taskId = req.params.id;
    const task = await Task.findByPk(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const list = await TaskComment.findAll({
      where: { taskId },
      include: [{ model: User, attributes: ['id','name','email'] }],
      order: [['created_at','ASC']]
    });
    return res.json(list);
  } catch (e) { return res.status(500).json({ message: e.message }); }
}

async function createComment(req, res) {
  try {
    const taskId = req.params.id;
    const task = await Task.findByPk(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const contentRaw = (req.body?.content ?? '').toString().trim();
    if (!contentRaw) return res.status(400).json({ message: 'Missing content' });
    const content = contentRaw.slice(0, 5000);
    const created = await TaskComment.create({ taskId, userId: req.user.id, content });
    const withUser = await TaskComment.findByPk(created.id, { include: [{ model: User, attributes: ['id','name','email'] }] });
    try { getIO().emit('dataUpdated', { resource: 'task_comments', action: 'create', id: created.id, taskId }); } catch (_) {}
    return res.status(201).json(withUser);
  } catch (e) { return res.status(500).json({ message: e.message }); }
}

module.exports.listComments = listComments;
module.exports.createComment = createComment;
