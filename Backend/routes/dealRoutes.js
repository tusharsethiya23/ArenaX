const express = require('express');
const router = express.Router();
const { createDeal, getMyDeals, updateDealStatus } = require('../controllers/dealController');
const { protect } = require('../middlewares/auth.middleware');

router.post('/', protect, createDeal);
router.get('/my-deals', protect, getMyDeals);
router.put('/:id', protect, updateDealStatus);

module.exports = router;