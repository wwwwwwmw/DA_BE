const { Op } = require('sequelize');
const { Task, TaskAssignment, Event, Participant, User, Project, Department, Label } = require('../../infrastructure/database/models');

// GET /api/schedule/upcoming?from=ISO&to=ISO
// Employee: own assigned tasks + events where participant
// Manager: tasks in own department + events in own department (or global) + participant events
// Admin: all tasks/events
async function upcoming(req, res) {
  try {
    const { from, to, limit = 100 } = req.query;
    const range = {};
    if (from || to) {
      range.start_time = {};
      const fromDate = from ? new Date(from) : null;
      const toDate = to ? new Date(to) : null;
      if (fromDate && !isNaN(fromDate)) range.start_time[Op.gte] = fromDate;
      if (toDate && !isNaN(toDate)) range.start_time[Op.lte] = toDate;
    }
    const taskWhere = {};
    if (range.start_time) taskWhere.start_time = range.start_time; // use start_time for tasks
    const eventWhere = {};
    if (range.start_time) eventWhere.start_time = range.start_time;

    // Role logic
    let taskInclude = [ Project, { model: Label }, { model: TaskAssignment, as: 'assignments', include: [{ model: User, attributes: ['id','name'] }] } ];
    if (req.user) {
      if (req.user.role === 'employee') {
        // Only tasks assigned to self
        taskInclude = [ Project, { model: Label }, { model: TaskAssignment, as: 'assignments', required: true, where: { userId: req.user.id }, include: [{ model: User, attributes: ['id','name'] }] } ];
      } else if (req.user.role === 'manager') {
        taskWhere.departmentId = req.user.departmentId || null;
      }
    }
    // Admin sees all
    const tasks = await Task.findAll({ where: taskWhere, include: taskInclude, order: [['start_time','ASC']], limit: Math.min(Number(limit)||100,200) });

    // Events role filter
    if (req.user) {
      if (req.user.role === 'employee') {
        // events where user is participant or creator
        eventWhere[Op.or] = [ { '$Participants.user_id$': req.user.id }, { createdById: req.user.id } ];
      } else if (req.user.role === 'manager') {
        // department events or global or participant
        const deptCond = { departmentId: req.user.departmentId || null };
        eventWhere[Op.or] = [ deptCond, { is_global: true }, { '$Participants.user_id$': req.user.id } ];
      }
    } else {
      eventWhere.is_global = true; eventWhere.status = 'approved';
    }
    const events = await Event.findAll({
      where: eventWhere,
      include: [
        { model: Participant, required: false, include: [{ model: User, attributes: ['id','name'] }] },
        { model: User, as: 'createdBy', attributes: ['id','name'] },
        { model: Department, attributes: ['id','name'] }
      ],
      order: [['start_time','ASC']],
      limit: Math.min(Number(limit)||100,200),
      subQuery: false
    });

    // Normalize response
    const outTasks = tasks.map(t => ({
      id: t.id,
      title: t.title,
      type: 'task',
      start_time: t.start_time,
      end_time: t.end_time,
      status: t.status,
      project: t.Project ? { id: t.Project.id, name: t.Project.name } : null,
      assignments: (t.assignments||[]).map(a => ({ userId: a.userId, progress: a.progress, status: a.status })),
      departmentId: t.departmentId,
      priority: t.priority,
    }));
    const outEvents = events.map(e => ({
      id: e.id,
      title: e.title,
      type: 'event',
      start_time: e.start_time,
      end_time: e.end_time,
      status: e.status,
      is_global: e.is_global,
      departmentId: e.departmentId,
      participants: (e.Participants||[]).map(p=>({ userId: p.userId })),
    }));
    return res.json({ tasks: outTasks, events: outEvents });
  } catch (e) {
    console.error('[schedule.upcoming] error', e);
    return res.status(500).json({ message: e.message });
  }
}

module.exports = { upcoming };