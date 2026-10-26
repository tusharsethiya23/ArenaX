const express = require('express');
const multer = require('multer');
const router = express.Router();
const {
  listListings, getListing, createListing, updateListing, deleteListing, MAX_PHOTOS,
} = require('../controllers/listing.controller');
const { protect, optionalProtect } = require('../middlewares/auth.middleware');
const { requireAccess } = require('../utils/access.util');
const upload = require('../middlewares/upload.middleware');

// Multer errors (too big, too many files) as a 400 JSON message
const uploadPhotos = (req, res, next) => {
  upload.array('photos', MAX_PHOTOS)(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      const messages = {
        LIMIT_FILE_SIZE: 'Each photo must be 5MB or smaller',
        LIMIT_UNEXPECTED_FILE: `You can add at most ${MAX_PHOTOS} photos`,
      };
      return res.status(400).json({ message: messages[err.code] || err.message });
    }
    res.status(400).json({ message: err.message });
  });
};

// Listing and managing gear needs an athlete/coach account (brand tokens have none)
const onlyUsers = (req, res, next) => (req.user ? next() : res.status(403).json({ message: 'Only athletes and coaches can list items' }));

router.get('/', optionalProtect, listListings);
router.get('/:id', getListing);
router.post('/', protect, onlyUsers, requireAccess('marketplaceListing'), uploadPhotos, createListing);
router.patch('/:id', protect, onlyUsers, updateListing);
router.delete('/:id', protect, onlyUsers, deleteListing);

module.exports = router;
