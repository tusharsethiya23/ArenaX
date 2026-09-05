const express = require('express');
const router = express.Router();
const { createSpotlight, getCurrentSpotlight } = require('../controllers/spotLightController');
const { protect } = require('../middlewares/auth.middleware');

router.post('/', protect, createSpotlight); // sirf brand hi bana sakta hai (req.brand check)
router.get('/current', getCurrentSpotlight); // public

module.exports = router;