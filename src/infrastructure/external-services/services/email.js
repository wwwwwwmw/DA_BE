// Email utility: prefers SendGrid if SENDGRID_API_KEY is set, otherwise falls back to Nodemailer JSON transport.
const nodemailer = require('nodemailer');
let useSendGrid = false;
let sgMail;

if (process.env.SENDGRID_API_KEY) {
  try {
    sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    useSendGrid = true;
  } catch (e) {
    // If @sendgrid/mail not installed yet or error – will fallback.
    useSendGrid = false;
  }
}

// Fallback transporter (dev) – logs message JSON to console
const fallbackTransporter = nodemailer.createTransport({ jsonTransport: true });

/**
 * sendMail
 * @param {Object} params
 * @param {string|string[]} params.to - Recipient(s)
 * @param {string} params.subject - Email subject
 * @param {string} [params.text] - Plain text body
 * @param {string} [params.html] - HTML body
 */
async function sendMail({ to, subject, text, html }) {
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM || 'no-reply@example.com';
  const fromName = process.env.SENDGRID_FROM_NAME || 'No Reply';

  if (useSendGrid) {
    const msg = {
      to,
      from: { email: fromEmail, name: fromName },
      subject,
      text: text || undefined,
      html: html || undefined,
    };
    try {
      const resp = await sgMail.send(msg);
      if (process.env.DEBUG_EMAIL === 'true') {
        console.log('[email] sendgrid success', {
          to,
          subject,
          provider: 'sendgrid',
          statusCode: resp?.[0]?.statusCode,
        });
      }
      return resp;
    } catch (err) {
      console.error('[email] sendgrid error', err?.response?.body || err);
      throw err;
    }
  }

  // Fallback dev JSON transport
  try {
    const info = await fallbackTransporter.sendMail({ from: fromEmail, to, subject, text, html });
    if (process.env.DEBUG_EMAIL === 'true') {
      console.log('[email] fallback dev transport', { to, subject, provider: 'nodemailer-json' });
    }
    return info;
  } catch (err) {
    console.error('[email] fallback transport error', err);
    throw err;
  }
}

module.exports = { sendMail };
