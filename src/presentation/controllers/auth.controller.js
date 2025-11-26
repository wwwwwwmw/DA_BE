const bcrypt = require('bcryptjs');
const { User, Department } = require('../../infrastructure/database/models');
const { signUser } = require('../../infrastructure/external-services/services/jwt');
const { sendMail } = require('../../infrastructure/external-services/services/email');
const jwt = require('jsonwebtoken');

async function register(req, res) {
  try {
    const { name, email, password, role, departmentId } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing required fields' });
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ message: 'Email already in use' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash, role: role || 'employee', departmentId: departmentId || null });
    const token = signUser(user);
    return res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, departmentId: user.departmentId } });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // Check if account is locked
    if (user.is_locked) {
      return res.status(403).json({
        message: 'Tài khoản đã bị khóa do nhập sai mật khẩu quá nhiều lần. Vui lòng liên hệ quản trị viên để kích hoạt lại.',
        locked: true
      });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      // Increment failed login attempts
      user.failed_login_attempts = (user.failed_login_attempts || 0) + 1;

      // Lock account if 5 failed attempts reached
      if (user.failed_login_attempts >= 5) {
        user.is_locked = true;
        await user.save();

        // Notify all admins about locked account
        try {
          const { notifyUsers } = require('../../infrastructure/external-services/services/notification.service');
          const admins = await User.findAll({ where: { role: 'admin' }, attributes: ['id'] });
          const adminIds = admins.map(a => a.id);
          if (adminIds.length) {
            await notifyUsers(
              adminIds,
              'Tài khoản bị khóa',
              `Tài khoản ${user.name} (${user.email}) đã bị khóa do nhập sai mật khẩu 5 lần.`,
              { ref_type: 'user', ref_id: user.id }
            );
          }
        } catch (notifyErr) {
          console.error('[login] notify admins error', notifyErr);
        }

        return res.status(403).json({
          message: 'Tài khoản đã bị khóa do nhập sai mật khẩu quá nhiều lần. Vui lòng liên hệ quản trị viên để kích hoạt lại.',
          locked: true
        });
      }

      await user.save();
      const remainingAttempts = 5 - user.failed_login_attempts;
      return res.status(401).json({
        message: `Đăng nhập thất bại. Còn ${remainingAttempts} lần thử trước khi khóa tài khoản.`,
        remainingAttempts: remainingAttempts
      });
    }

    // Successful login - reset failed attempts counter
    if (user.failed_login_attempts > 0) {
      user.failed_login_attempts = 0;
      await user.save();
    }

    const token = signUser(user);
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, departmentId: user.departmentId } });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

// Adjusted flow: user requests reset -> notify admin; admin will perform reset manually.
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Missing email' });
    const user = await User.findOne({ where: { email } });
    // Always return generic message to avoid enumeration.
    if (user) {
      // Prepare email to admin
      const adminEmail = process.env.ADMIN_EMAIL || process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM;
      if (adminEmail) {
        if (process.env.DEBUG_EMAIL === 'true') {
          console.log('[forgot-password] notifying admin', { userId: user.id, email: user.email, adminEmail });
        }
        await sendMail({
          to: adminEmail,
          subject: 'Yêu cầu đặt lại mật khẩu',
          text: `Người dùng yêu cầu đặt lại mật khẩu:\nID: ${user.id}\nEmail: ${user.email}\nTên: ${user.name}\nVui lòng truy cập trang quản trị để reset.`,
          html: `<p>Người dùng yêu cầu đặt lại mật khẩu:</p><ul><li>ID: ${user.id}</li><li>Email: ${user.email}</li><li>Tên: ${user.name}</li></ul><p>Vui lòng truy cập trang quản trị để thực hiện reset.</p>`
        });
      } else if (process.env.DEBUG_EMAIL === 'true') {
        console.warn('[forgot-password] no adminEmail configured');
      }

      // Create in-app notifications for all admin users
      try {
        const { User } = require('../../infrastructure/database/models');
        const { notifyUsers } = require('../../infrastructure/external-services/services/notification.service');
        const admins = await User.findAll({ where: { role: 'admin' }, attributes: ['id', 'email'] });
        const adminIds = admins.map(a => a.id);
        if (adminIds.length) {
          await notifyUsers(adminIds,
            'Yêu cầu đặt lại mật khẩu',
            `Người dùng ${user.name} (${user.email}) yêu cầu đặt lại mật khẩu.`,
            { ref_type: 'user', ref_id: user.id }
          );
          if (process.env.DEBUG_EMAIL === 'true') {
            console.log('[forgot-password] notifications created for admins', adminIds);
          }
        } else if (process.env.DEBUG_EMAIL === 'true') {
          console.warn('[forgot-password] no admin accounts found for notification');
        }
      } catch (notifyErr) {
        console.error('[forgot-password] notifyUsers error', notifyErr);
      }
    }
    return res.json({ message: 'Nếu email tồn tại hệ thống sẽ thông báo cho admin.' });
  } catch (e) {
    console.error('[forgot-password] error', e);
    return res.status(500).json({ message: e.message });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: 'Missing token or newPassword' });
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwt');
    const user = await User.findByPk(payload.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await user.save();
    return res.json({ message: 'Password updated' });
  } catch (e) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }
}

module.exports = { register, login, forgotPassword, resetPassword };
