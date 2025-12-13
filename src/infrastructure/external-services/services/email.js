// Email utility: prefers MailerSend if MAILERSEND_API_KEY is set, otherwise falls back to Nodemailer JSON transport.
const nodemailer = require('nodemailer');
let useMailerSend = false;
let MailerSend, EmailParams, Sender, Recipient;

if (process.env.MAILERSEND_API_KEY) {
  try {
    ({ MailerSend, EmailParams, Sender, Recipient } = require('mailersend'));
    useMailerSend = true;
  } catch (e) {
    useMailerSend = false;
  }
}

// Optional SMTP transporter if credentials provided; otherwise fallback JSON transport
let smtpTransporter = null;
if (process.env.SMTP_HOST) {
  try {
    smtpTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
      auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
    });
  } catch (e) {
    console.warn('[email] failed to init SMTP transporter, will use JSON fallback', e);
    smtpTransporter = null;
  }
}

const fallbackTransporter = smtpTransporter || nodemailer.createTransport({ jsonTransport: true });

/**
 * sendMail
 * @param {Object} params
 * @param {string|string[]} params.to - Recipient(s)
 * @param {string} params.subject - Email subject
 * @param {string} [params.text] - Plain text body
 * @param {string} [params.html] - HTML body
 */
async function sendMail({ to, subject, text, html }) {
  const fromEmail = process.env.MAILERSEND_FROM_EMAIL || process.env.EMAIL_FROM || 'no-reply@example.com';
  const fromName = process.env.MAILERSEND_FROM_NAME || 'No Reply';

  if (useMailerSend) {
    try {
      const mailersend = new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY });
      const sentFrom = new Sender(fromEmail, fromName);
      const recipients = Array.isArray(to) ? to.map(t => new Recipient(t)) : [new Recipient(to)];
      const emailParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo(recipients)
        .setSubject(subject)
        .setHtml(html || undefined)
        .setText(text || undefined);

      const resp = await mailersend.email.send(emailParams);
      if (process.env.DEBUG_EMAIL === 'true') {
        console.log('[email] mailersend success', { to, subject, provider: 'mailersend' });
      }
      return resp;
    } catch (err) {
      console.error('[email] mailersend error', err?.response?.body || err);
      try {
        const info = await fallbackTransporter.sendMail({ from: fromEmail, to, subject, text, html });
        if (process.env.DEBUG_EMAIL === 'true') {
          console.log('[email] fallback after mailersend failure', {
            to,
            subject,
            provider: smtpTransporter ? 'smtp' : 'nodemailer-json'
          });
        }
        return info;
      } catch (fallbackErr) {
        console.error('[email] fallback transport error', fallbackErr);
        throw err;
      }
    }
  }

  // Fallback dev JSON transport (or SMTP if configured above)
  try {
    const info = await fallbackTransporter.sendMail({ from: fromEmail, to, subject, text, html });
    if (process.env.DEBUG_EMAIL === 'true') {
      console.log('[email] fallback dev transport', {
        to,
        subject,
        provider: smtpTransporter ? 'smtp' : 'nodemailer-json'
      });
    }
    return info;
  } catch (err) {
    console.error('[email] fallback transport error', err);
    throw err;
  }
}

module.exports = { sendMail };
