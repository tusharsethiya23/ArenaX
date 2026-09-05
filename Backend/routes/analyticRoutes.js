const express = require('express');
const router = express.Router();
const { recordProfileView, getMyAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middlewares/auth.middleware');

router.post('/view/:userId', recordProfileView); // public — kisi ki profile khulte hi call hoga
router.get('/my-analytics', protect, getMyAnalytics);

module.exports = router;