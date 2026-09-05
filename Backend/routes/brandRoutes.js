const express = require('express');
const router = express.Router();
const { registerBrand, loginBrand, searchTalent } = require('../controllers/brandController');
const { protect } = require('../middlewares/auth.middleware');

router.post('/register', registerBrand);
router.post('/login', loginBrand);
router.get('/search-talent', protect, searchTalent);

module.exports = router;