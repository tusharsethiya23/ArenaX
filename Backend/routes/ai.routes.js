const express = require('express');
const router = express.Router();
const { askCoach } = require('../controllers/ai.controller');
const { protect } = require('../middlewares/auth.middleware');
const { requireAccess } = require('../utils/access.util');

router.post('/ask', protect, requireAccess('aiCoach'), askCoach); // AI coach (Gemini), answers with the user's DNA as context

module.exports = router;
