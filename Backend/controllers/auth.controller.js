const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Signup
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, sport, location, pricePerSession, skillLevelTaught, goals, skillLevel, bio } = req.body;

    // Security: block anyone from registering themselves as admin directly.
    // Admin accounts are only created manually in the database.
    if (role === 'admin') {
      return res.status(403).json({ message: 'Cannot register as admin' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name, email, password: hashedPassword, role,
      sport, location, pricePerSession, skillLevelTaught, goals, skillLevel, bio,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      _id: user._id, name: user.name, email: user.email, role: user.role, token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Accounts created with Google have no password
        if (!user.password) {
            return res.status(400).json({ message: 'This account uses Google sign-in. Use "Continue with Google" instead.' });
        }

        // Password match karo
        const isMatch = await bcrypt.compare(String(password || ''), user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '30d',
        });

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/auth/google — { credential, role? }
// `credential` is the ID token from the "Continue with Google" button. We ask
// Google to verify it (no client secret needed), then log in the account with
// that email, or create one. Google has confirmed the person owns the email,
// so an existing password account with the same email is logged in too.
// New accounts need a role; without one we answer 400 with code ROLE_REQUIRED
// and the page asks "learner or coach?" and sends the same credential again.
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client();
const GOOGLE_ROLES = ['learner', 'coach'];

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const googleLogin = async (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(503).json({ message: 'Google sign-in is not set up on the server' });
    }
    const { credential, role } = req.body;
    if (typeof credential !== 'string' || !credential) {
      return res.status(400).json({ message: 'Missing Google credential' });
    }

    // Ask Google to verify this token is genuine and meant for our app
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: clientId });
      payload = ticket.getPayload(); // { sub, email, email_verified, name, picture, ... }
    } catch {
      return res.status(401).json({ message: 'Google sign-in failed. Please try again.' });
    }
    if (!payload?.email || !payload.email_verified) {
      return res.status(401).json({ message: 'Your Google account email is not verified' });
    }

    let created = false;
    let user = await User.findOne({ email: { $regex: `^${escapeRegex(payload.email)}$`, $options: 'i' } });

    if (!user) {
      // Security: only learner or coach — never admin
      if (!GOOGLE_ROLES.includes(role)) {
        return res.status(400).json({ code: 'ROLE_REQUIRED', message: 'Are you joining as a learner or a coach?' });
      }
      user = await User.create({
        name: payload.name || payload.email.split('@')[0],
        email: payload.email.toLowerCase(),
        role,
        profilePhoto: payload.picture || '',
        googleId: true, // no password; this account logs in with Google
      });
      created = true;
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(created ? 201 : 200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePhoto: user.profilePhoto,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, googleLogin };