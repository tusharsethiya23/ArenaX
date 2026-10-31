const express = require('express');
const router = express.Router();
const { createDeal, getSentDeals, getMyDeals, updateDealStatus, getDealMessages, sendDealMessage } = require('../controllers/deal.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/', protect, createDeal);
router.get('/sent', protect, getSentDeals);
router.get('/my-deals', protect, getMyDeals);
router.put('/:id', protect, updateDealStatus);
// Chat between the brand and the coach/athlete once the offer is accepted
router.get('/:id/messages', protect, getDealMessages);
router.post('/:id/messages', protect, sendDealMessage);

module.exports = router;