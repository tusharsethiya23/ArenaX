const express = require('express');
const router = express.Router();
const { createDeal, getSentDeals, getMyDeals, updateDealStatus } = require('../controllers/deal.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/', protect, createDeal);
router.get('/sent', protect, getSentDeals);
router.get('/my-deals', protect, getMyDeals);
router.put('/:id', protect, updateDealStatus);

module.exports = router;