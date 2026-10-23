const express = require('express');
const multer = require('multer');
const router = express.Router();
const { createPost, getFeed, getFollowingFeed, MAX_IMAGES } = require('../controllers/post.controller');
const { protect } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

// Run multer ourselves so its errors (too big, wrong type, too many files)
// come back as a 400 JSON message instead of Express's default error page
const uploadImages = (req, res, next) => {
  upload.array('images', MAX_IMAGES)(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      const messages = {
        LIMIT_FILE_SIZE: 'Each image must be 5MB or smaller',
        LIMIT_UNEXPECTED_FILE: `You can attach at most ${MAX_IMAGES} images`,
      };
      return res.status(400).json({ message: messages[err.code] || err.message });
    }
    res.status(400).json({ message: err.message });
  });
};

// The Following feed needs a platform user (brand tokens have no follows)
const onlyUsers = (req, res, next) =>
  req.user ? next() : res.status(403).json({ message: 'Only users have a following feed' });

router.get('/', getFeed); // public — feed padhne ke liye login zaroori nahi
router.get('/following', protect, onlyUsers, getFollowingFeed);
router.post('/', protect, uploadImages, createPost);

module.exports = router;
