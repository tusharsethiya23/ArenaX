const express = require('express');
const router = express.Router();
const { createEndorsement, getEndorsementsForUser } = require('../controllers/endorsementController');
const { protect } = require('../middlewares/auth.middleware');

router.post('/', protect, createEndorsement);
router.get('/:userId', getEndorsementsForUser); // public

module.exports = router;