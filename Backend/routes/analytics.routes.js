const express = require('express');
const router = express.Router();
const { recordProfileView, getMyAnalytics } = require('../controllers/analytics.controller');
const { protect } = require('../middlewares/auth.middleware');
const { requireAccess } = require('../utils/access.util');

router.post('/view/:userId', recordProfileView); // public — kisi ki profile khulte hi call hoga
router.get('/my-analytics', protect, requireAccess('coachStats'), getMyAnalytics);

module.exports = router;