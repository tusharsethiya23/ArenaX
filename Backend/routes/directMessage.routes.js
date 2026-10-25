const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { getInbox, getConversation, sendDirectMessage } = require('../controllers/directMessage.controller');

// Direct messages are for user accounts (athletes, coaches, admins), not brands
const usersOnly = (req, res, next) => (req.user ? next() : res.status(403).json({ message: 'Messages are only for athlete and coach accounts' }));

router.get('/', protect, usersOnly, getInbox);
router.get('/:userId', protect, usersOnly, getConversation);
router.post('/:userId', protect, usersOnly, sendDirectMessage);

module.exports = router;
