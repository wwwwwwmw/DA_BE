const { Notification, User } = require('../../database/models');
const { emitToUser } = require('./socket');
const { sendMail } = require('./email');

async function notifyUsers(userIds, title, message, extra = {}) {
  if (!Array.isArray(userIds)) userIds = [userIds];
  const uniq = Array.from(new Set(userIds.filter(Boolean)));
  if (!uniq.length) return [];
  const payloads = uniq.map((userId) => ({ userId, title, message, ref_type: extra.ref_type || null, ref_id: extra.ref_id || null }));
  const created = await Notification.bulkCreate(payloads);
  for (const n of created) {
    emitToUser(n.userId, 'receiveNotification', { id: n.id, title: n.title, message: n.message, is_read: n.is_read, ref_type: n.ref_type, ref_id: n.ref_id });
  }
  // Send email copies (best effort, non-blocking errors)
  try {
    const users = await User.findAll({ where: { id: uniq }, attributes: ['email','name'] });
    const emails = users.map(u => u.email).filter(Boolean);
    if (emails.length) {
      const plainText = `${title}\n\n${message}`;
      const html = `<h3>${title}</h3><p>${message}</p>`;
      // Batch send in a single email if many recipients (SendGrid supports array)
      await sendMail({ to: emails, subject: title, text: plainText, html });
    }
  } catch (e) {
    console.error('[notifyUsers] email error', e.message || e);
  }
  return created;
}

module.exports = { notifyUsers };
