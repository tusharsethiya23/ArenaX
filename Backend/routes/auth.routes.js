// auth.routes.js
// Authentication endpoints: register, login, and a protected profile check.

const express = require('express');
const router = express.Router();

// Make sure this path matches your real controller file name
// (authController or auth.controller)
const { registerUser, loginUser, googleLogin } = require('../controllers/auth.controller.js');
const { protect } = require('../middlewares/auth.middleware.js');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin); // "Continue with Google" (ID token from the button)


// Quick token test: returns the logged-in user
router.get('/profile', protect, (req, res) => {
  res.json(req.user);
});

module.exports = router;