const express = require('express');
const router = express.Router();
const { subscribe, getMySubscription, cancelSubscription } = require('../controllers/subscriptionController');
const { protect } = require('../middlewares/auth.middleware');

router.post('/', protect, subscribe);
router.get('/my-subscription', protect, getMySubscription);
router.put('/cancel', protect, cancelSubscription);

module.exports = router;