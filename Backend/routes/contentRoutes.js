const express = require('express');
const router = express.Router();
const {
  createContent,
  getAllContent,
  purchaseContent,
  getMyPurchases,
} = require('../controllers/contentController');
const { protect } = require('../middlewares/auth.middleware');

router.post('/', protect, createContent);
router.get('/', getAllContent); // public — browsing ke liye
router.post('/:id/purchase', protect, purchaseContent);
router.get('/my-purchases', protect, getMyPurchases);

module.exports = router;