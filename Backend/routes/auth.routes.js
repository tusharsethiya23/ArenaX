// auth.routes.js
// Authentication endpoints: sign-up, login, email verification, Google
// sign-in, and a protected profile check.

const express = require('express');
const router = express.Router();

const { registerUser, loginUser, verifyEmail, resendCode, googleLogin } = require('../controllers/auth.controller.js');
const { protect } = require('../middlewares/auth.middleware.js');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-email', verifyEmail); // { email, code } from the emailed 6-digit code
router.post('/resend-code', resendCode);
router.post('/google', googleLogin); // "Continue with Google" (ID token from the button)

// Quick token test: returns the logged-in user
router.get('/profile', protect, (req, res) => {
  res.json(req.user);
});

module.exports = router;
