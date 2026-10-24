// email.util.js
// Which email addresses can sign up: real-looking Gmail addresses only
// (6-30 letters, digits or dots before @gmail.com / @googlemail.com, with an
// optional "+tag"). Whether the address actually exists is proven by the
// 6-digit code we email to it (see emailCode.util.js).

const GMAIL_RE = /^[a-z0-9](?:[a-z0-9.]{4,28})[a-z0-9](?:\+[a-z0-9._-]{1,30})?@(?:gmail|googlemail)\.com$/;

const normalizeEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '');

const isGmail = (email) => {
  const e = normalizeEmail(email);
  return GMAIL_RE.test(e) && !e.includes('..');
};

const GMAIL_ONLY_MESSAGE = 'Please use a valid Gmail address (like yourname@gmail.com)';

module.exports = { normalizeEmail, isGmail, GMAIL_ONLY_MESSAGE };
