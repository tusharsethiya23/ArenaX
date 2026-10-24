const express = require('express');
const router = express.Router();
const { askCoach } = require('../controllers/ai.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/ask', protect, askCoach); // AI coach (Gemini), answers with the user's DNA as context

module.exports = router;
