// mailer.util.js
// Sends emails through Gmail (GMAIL_USER + GMAIL_APP_PASSWORD, an App password
// from the Google account's security settings).
// Without those set: on your own computer the code is printed in the backend
// terminal instead, so sign-up can be tried locally; on Render (which sets
// RENDER=true) sending fails, so nobody gets stuck waiting for an email.

const nodemailer = require('nodemailer');

let transporter = null;
const getTransporter = () => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return null;
  transporter ||= nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, '') },
  });
  return transporter;
};

const canPrintInstead = () => !process.env.RENDER && process.env.NODE_ENV !== 'production';

// Can emails be delivered (or, locally, printed)?
const mailerReady = () => Boolean(getTransporter()) || canPrintInstead();

const sendVerificationCode = async (to, code) => {
  const t = getTransporter();
  if (!t) {
    if (!canPrintInstead()) throw new Error('Email sending is not set up');
    console.log(`[email not set up] ArenaX code for ${to}: ${code}`);
    return;
  }
  await t.sendMail({
    from: `"ArenaX" <${process.env.GMAIL_USER}>`,
    to,
    subject: `${code} is your ArenaX code`,
    text: `Your ArenaX verification code is ${code}.\n\nIt expires in 10 minutes. If you didn't try to sign up or log in to ArenaX, you can ignore this email.`,
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#111">
      <p>Your ArenaX verification code is</p>
      <p style="font-size:32px;font-weight:bold;letter-spacing:6px;margin:12px 0">${code}</p>
      <p style="color:#666">It expires in 10 minutes. If you didn't try to sign up or log in to ArenaX, you can ignore this email.</p>
    </div>`,
  });
};

module.exports = { mailerReady, sendVerificationCode };
