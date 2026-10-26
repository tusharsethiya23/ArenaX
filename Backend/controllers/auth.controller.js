// auth.controller.js
// Sign-up, login, email verification and "Continue with Google".
//
// Email/password accounts must use a Gmail address and prove it's real: we
// email a 6-digit code, and the account only works once the code is entered
// (emailVerified). Google sign-in counts as verified, since Google has already
// checked the address.
// Sign-ups may carry an invite code (`ref`, from someone's invite link): the
// inviter earns Arena Points once the new account is verified.

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/user.model');
const { normalizeEmail, isGmail, GMAIL_ONLY_MESSAGE } = require('../utils/email.util');
const { mailerReady } = require('../utils/mailer.util');
const { issueCode, checkCode } = require('../utils/emailCode.util');
const { inviterFor, rewardReferral } = require('../utils/points.util');

const SIGNUP_ROLES = ['learner', 'coach']; // admin accounts are only made by hand in the database
const MIN_PASSWORD = 8;

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Older accounts may have stored their email with capitals
const findByEmail = (email) => User.findOne({ email: { $regex: `^${escapeRegex(email)}$`, $options: 'i' } });

// What the app stores after logging in
const session = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  profilePhoto: user.profilePhoto,
  token: jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' }),
});

const notVerified = (res, email, extra = '') => res.status(403).json({
  code: 'EMAIL_NOT_VERIFIED',
  email,
  message: `Enter the 6-digit code we sent to ${email}.${extra}`,
});

// POST /api/auth/register — { name, email, password, role, ref?, ...profile }
// Creates an unverified account and emails a code. No login until verified.
const registerUser = async (req, res) => {
  try {
    const { password, sport, location, skillLevelTaught, goals, skillLevel, bio } = req.body;
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const email = normalizeEmail(req.body.email);
    const role = req.body.role ?? 'learner';

    if (role === 'admin') return res.status(403).json({ message: 'Cannot register as admin' });
    if (!SIGNUP_ROLES.includes(role)) return res.status(400).json({ message: 'Choose learner or coach' });
    if (!name || name.length > 60) return res.status(400).json({ message: 'Enter your name (up to 60 characters)' });
    if (!isGmail(email)) return res.status(400).json({ message: GMAIL_ONLY_MESSAGE });
    if (typeof password !== 'string' || password.length < MIN_PASSWORD || password.length > 100) {
      return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD} characters` });
    }
    if (!mailerReady()) {
      return res.status(503).json({ message: 'Email sign-up is not available right now. Please use "Continue with Google".' });
    }

    if (await findByEmail(email)) {
      return res.status(400).json({ message: 'An account with this email already exists. Log in instead.' });
    }

    const user = await User.create({
      name, email, role,
      password: await bcrypt.hash(password, await bcrypt.genSalt(10)),
      emailVerified: false,
      sport, location, skillLevelTaught, goals, skillLevel, bio,
      referredBy: await inviterFor(req.body.ref),
    });

    const sent = await issueCode(email);
    res.status(201).json({
      code: 'EMAIL_NOT_VERIFIED',
      email: user.email,
      codeSent: sent.ok,
      message: sent.ok
        ? `We sent a 6-digit code to ${user.email}. Enter it to finish signing up.`
        : `Your account was created, but the email didn't send: ${sent.message}`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/login — { email, password }
// Accounts that haven't verified their Gmail get a fresh code instead of a login.
const loginUser = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = email && await findByEmail(email);
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    // Accounts created with Google have no password
    if (!user.password) {
      return res.status(400).json({ message: 'This account uses Google sign-in. Use "Continue with Google" instead.' });
    }
    const isMatch = await bcrypt.compare(String(req.body.password || ''), user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    if (user.emailVerified !== true) {
      if (!isGmail(user.email)) {
        return res.status(403).json({
          code: 'EMAIL_NOT_ALLOWED',
          message: "This account's email can't be verified. Please sign up again with your Gmail address.",
        });
      }
      const sent = await issueCode(user.email);
      // A code sent less than a minute ago is still fine to use
      return notVerified(res, user.email, sent.ok ? '' : ` (${sent.message})`);
    }

    res.json(session(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/verify-email — { email, code } -> logged in
const verifyEmail = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = email && await findByEmail(email);
    if (!user || user.emailVerified === true) {
      return res.status(400).json({ message: user ? 'This email is already verified. Please log in.' : 'No account is waiting for this code' });
    }
    const result = await checkCode(user.email, req.body.code);
    if (!result.ok) return res.status(400).json({ message: result.message });

    user.emailVerified = true;
    await user.save();
    await rewardReferral(user);
    res.json(session(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/resend-code — { email }
const resendCode = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = email && await findByEmail(email);
    // Same answer whether or not the account exists, so emails can't be probed
    if (!user || user.emailVerified === true || !isGmail(user.email)) {
      return res.json({ message: 'If this email is waiting for verification, we sent a new code.' });
    }
    const sent = await issueCode(user.email);
    if (!sent.ok) return res.status(sent.status).json({ message: sent.message });
    res.json({ message: `We sent a new code to ${user.email}.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/google — { credential, role?, ref? }
// `credential` is the ID token from the "Continue with Google" button. We ask
// Google to verify it (no client secret needed), then log in the account with
// that email, or create one. New accounts need a role; without one we answer
// 400 with code ROLE_REQUIRED and the page asks "learner or coach?".
const googleClient = new OAuth2Client();

const googleLogin = async (req, res) => {
  try {
    // Tolerate stray spaces or quotes pasted into the environment variable
    const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim().replace(/^["']|["']$/g, '');
    if (!clientId) {
      return res.status(503).json({ message: 'Google sign-in is not set up on the server' });
    }
    const { credential, role, ref } = req.body;
    if (typeof credential !== 'string' || !credential) {
      return res.status(400).json({ message: 'Missing Google credential' });
    }

    // Ask Google to verify this token is genuine and meant for our app
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: clientId });
      payload = ticket.getPayload(); // { sub, email, email_verified, name, picture, ... }
    } catch (err) {
      // Shows in the server logs, e.g. a GOOGLE_CLIENT_ID that doesn't match the frontend's
      console.error('Google sign-in rejected:', err.message, `(server GOOGLE_CLIENT_ID ends in ...${clientId.slice(-30)})`);
      return res.status(401).json({ message: 'Google sign-in failed. Please try again.' });
    }
    if (!payload?.email || !payload.email_verified) {
      return res.status(401).json({ message: 'Your Google account email is not verified' });
    }

    let created = false;
    let user = await findByEmail(payload.email);

    if (!user) {
      // Security: only learner or coach — never admin
      if (!SIGNUP_ROLES.includes(role)) {
        return res.status(400).json({ code: 'ROLE_REQUIRED', message: 'Are you joining as a learner or a coach?' });
      }
      user = await User.create({
        name: payload.name || payload.email.split('@')[0],
        email: payload.email.toLowerCase(),
        role,
        profilePhoto: payload.picture || '',
        googleId: true, // no password; this account logs in with Google
        emailVerified: true,
        referredBy: await inviterFor(ref),
      });
      created = true;
      await rewardReferral(user);
    } else if (user.emailVerified !== true) {
      // Google just proved who owns this email. A password set before the email
      // was verified may have been chosen by someone else, so it's removed:
      // this account now logs in with Google.
      Object.assign(user, { emailVerified: true, googleId: true, password: undefined });
      await user.save();
      await rewardReferral(user);
    }

    res.status(created ? 201 : 200).json(session(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, verifyEmail, resendCode, googleLogin };
