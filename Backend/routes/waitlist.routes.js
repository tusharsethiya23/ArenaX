// waitlist.routes.js — the "Notify me" list on the Pro coming soon page
//   GET  /api/waitlist/me  { joined: true | false }
//   POST /api/waitlist     join (joining twice is fine)

const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const Waitlist = require('../models/waitlist.model');

const usersOnly = (req, res, next) => (req.user ? next() : res.status(403).json({ message: 'The Pro waitlist is for athlete and coach accounts' }));

router.get('/me', protect, usersOnly, async (req, res) => {
  try {
    res.json({ joined: Boolean(await Waitlist.exists({ user: req.user._id })) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, usersOnly, async (req, res) => {
  try {
    await Waitlist.updateOne(
      { user: req.user._id },
      { $setOnInsert: { user: req.user._id, email: req.user.email, role: req.user.role } },
      { upsert: true },
    );
    res.status(201).json({ joined: true });
  } catch (error) {
    if (error.code === 11000) return res.status(201).json({ joined: true });
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
