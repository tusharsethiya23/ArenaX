const User = require('../models/User');
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

        // Password match karo
        const isMatch = await bcrypt.compare(password, user.password);
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

// Verifies a Google ID token and either logs in an existing user
// or creates a new one. Since Google itself verifies the email ownership,
// we trust the email that comes back from Google without extra checks.
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res) => {
  try {
    const { credential, role } = req.body; // credential = the ID token from Google

    // Ask Google to verify this token is genuine and get the user's info from it
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload(); // { email, name, picture, ... }

    let user = await User.findOne({ email: payload.email });

    if (!user) {
      // First time logging in with this Google account — create a new user.
      // 'role' must be provided on first login since our platform needs to
      // know if this person is a learner or a coach.
      if (!role) {
        return res.status(400).json({ message: 'Role is required for first-time Google sign-in' });
      }

      user = await User.create({
        name: payload.name,
        email: payload.email,
        password: '', // no password needed — this account only logs in via Google
        role,
        profilePhoto: payload.picture || '',
        googleId: true
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
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