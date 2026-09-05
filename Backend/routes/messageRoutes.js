const express = require('express');
const router = express.Router();
const { sendMessage, getMessagesForBooking } = require('../controllers/messageController');
const { protect } = require('../middlewares/auth.middleware');

router.post('/', protect, sendMessage);
router.get('/:bookingId', protect, getMessagesForBooking);

module.exports = router;