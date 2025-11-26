const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User, Department } = require('../../infrastructure/database/models');
const { checkBusinessTripConflict } = require('../../infrastructure/external-services/services/business-trip-validator');
const { sendMail } = require('../../infrastructure/external-services/services/email');

async function listUsers(req, res) {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [{ model: Department }],
      limit: Number(limit), offset: Number(offset),
      order: [['created_at', 'DESC']]
    });
    // Manager scope: filter by their department only
    if (req.user && req.user.role === 'manager') {
      const deptId = req.user.departmentId || null;
      return res.json(users.filter(u => String(u.departmentId || '') === String(deptId || '')));
    }
    return res.json(users);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

async function getUser(req, res) {
  try {
    const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] }, include: [{ model: Department }] });
    if (!user) return res.status(404).json({ message: 'Not found' });
    // self or admin check is in middleware
    return res.json(user);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

async function updateUser(req, res) {
  try {
    const { name, email, departmentId, password, contact, employeePin, avatarUrl, role } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    // self or admin enforced by middleware; only admin can change role
    if (name) user.name = name;
    if (email) user.email = email;
    if (typeof departmentId !== 'undefined') user.departmentId = departmentId;
    if (password) user.password = await bcrypt.hash(password, 10);
    if (typeof contact !== 'undefined') user.contact = contact;
    if (typeof employeePin !== 'undefined') user.employee_pin = employeePin;
    if (typeof avatarUrl !== 'undefined') user.avatar_url = avatarUrl;
    if (typeof role !== 'undefined') {
      if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only admin can change role' });
      user.role = role;
    }
    await user.save();
    const plain = user.toJSON();
    delete plain.password;
    return res.json(plain);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

async function createUser(req, res) {
  try {
    const { name, email, password, role = 'employee', departmentId, contact, employeePin, avatarUrl } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing required fields' });
    if (!(req.user.role === 'admin' || req.user.role === 'manager')) return res.status(403).json({ message: 'Forbidden' });
    // Manager restrictions
    if (req.user.role === 'manager') {
      if (role !== 'employee') return res.status(403).json({ message: 'Manager can only create employees' });
      if (departmentId && String(departmentId) !== String(req.user.departmentId)) {
        return res.status(403).json({ message: 'Cannot create user for another department' });
      }
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash, role, departmentId: departmentId || (req.user.role === 'manager' ? req.user.departmentId : null) || null, contact, employee_pin: employeePin, avatar_url: avatarUrl });
    const plain = user.toJSON();
    delete plain.password;
    return res.status(201).json(plain);
  } catch (e) {
    if (e.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    return res.status(500).json({ message: e.message });
  }
}

async function deleteUser(req, res) {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    if (String(req.user.id) === String(req.params.id)) return res.status(400).json({ message: 'Cannot delete self' });
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    await user.destroy();
    return res.json({ message: 'Deleted' });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

module.exports = { listUsers, getUser, updateUser, createUser, deleteUser };
/**
 * Admin resets a user's password, generates a temporary one and emails the user.
 */
async function adminResetPassword(req, res) {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    // Generate strong random password (base64url trimmed)
    const tempPassword = crypto.randomBytes(12).toString('base64url');
    const hash = await bcrypt.hash(tempPassword, 10);
    user.password = hash;
    await user.save();
    // Email user
    await sendMail({
      to: user.email,
      subject: 'Mật khẩu tạm thời mới',
      text: `Mật khẩu tạm thời của bạn: ${tempPassword}\nVui lòng đăng nhập và đổi mật khẩu ngay.`,
      html: `<p>Mật khẩu tạm thời của bạn: <strong>${tempPassword}</strong></p><p>Vui lòng đăng nhập và đổi mật khẩu ngay.</p>`
    });
    return res.json({ message: 'Password reset & emailed', userId: user.id });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

module.exports.adminResetPassword = adminResetPassword;

/**
 * Admin unlocks a locked user account
 */
async function unlockAccount(req, res) {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });

    // Unlock account and reset failed attempts
    user.is_locked = false;
    user.failed_login_attempts = 0;
    await user.save();

    // Send in-app notification
    try {
      const { notifyUsers } = require('../../infrastructure/external-services/services/notification.service');
      await notifyUsers(
        user.id,
        'Tài khoản đã được mở khóa',
        'Quản trị viên đã mở khóa tài khoản của bạn. Bạn có thể đăng nhập lại.',
        { ref_type: 'user', ref_id: user.id }
      );
    } catch (notifyErr) {
      console.error('[unlockAccount] notify user error', notifyErr);
    }

    // Send email notification
    try {
      await sendMail({
        to: user.email,
        subject: 'Tài khoản đã được mở khóa',
        text: `Xin chào ${user.name},\n\nTài khoản của bạn đã được quản trị viên mở khóa. Bạn có thể đăng nhập lại ngay bây giờ.\n\nTrân trọng,\nHệ thống quản lý`,
        html: `<p>Xin chào <strong>${user.name}</strong>,</p><p>Tài khoản của bạn đã được quản trị viên mở khóa. Bạn có thể đăng nhập lại ngay bây giờ.</p><p>Trân trọng,<br>Hệ thống quản lý</p>`
      });
    } catch (emailErr) {
      console.error('[unlockAccount] send email error', emailErr);
    }

    const plain = user.toJSON();
    delete plain.password;
    return res.json({ message: 'Account unlocked successfully', user: plain });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

module.exports.unlockAccount = unlockAccount;

/**
 * Pre-check business trip conflict for a user before assigning/creating task
 * GET /api/users/:id/business-trip-conflict?start=ISO&end=ISO
 * Roles: admin, manager (employee can check self)
 */
async function userBusinessTripConflict(req, res) {
  try {
    const targetUserId = req.params.id;
    const { start, end } = req.query;
    if (!start) return res.status(400).json({ message: 'Missing start time' });
    // Auth required by router.use(auth)
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    // Employees can only check themselves
    if (req.user.role === 'employee' && String(req.user.id) !== String(targetUserId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    // Managers can only check users in their department
    if (req.user.role === 'manager') {
      const u = await User.findByPk(targetUserId, { attributes: ['id','departmentId'] });
      if (!u) return res.status(404).json({ message: 'User not found' });
      if (String(u.departmentId || '') !== String(req.user.departmentId || '')) {
        return res.status(403).json({ message: 'Cross-department not allowed' });
      }
    }
    const result = await checkBusinessTripConflict(targetUserId, start, end);
    return res.json({ hasConflict: result.hasConflict, message: result.message, conflict: result.conflictDetails });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

module.exports.userBusinessTripConflict = userBusinessTripConflict;
