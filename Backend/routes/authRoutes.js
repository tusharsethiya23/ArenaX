const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authControllers');
const { protect } = require('../middlewares/auth.middleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, (req, res) => {
    res.json(req.user);
});

module.exports = router;