const express = require('express');
const router = express.Router();
const { getCoaches, updateProfile, uploadProfilePhoto, getUserById } = require('../controllers/userController');
const { protect } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

router.get('/coaches', getCoaches);
router.get('/:id', getUserById); // public
router.put('/profile', protect, updateProfile);
router.post('/profile/photo', protect, upload.single('photo'), uploadProfilePhoto);



module.exports = router;