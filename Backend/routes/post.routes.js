const express = require('express');
const multer = require('multer');
const router = express.Router();
const {
  createPost, getFeed, getFollowingFeed, getCoachesFeed, getSavedPosts, getPost, deletePost,
  likePost, unlikePost, savePost, unsavePost, getComments, getReplies, addComment, deleteComment,
  MAX_IMAGES,
} = require('../controllers/post.controller');
const { protect, optionalProtect } = require('../middlewares/auth.middleware');
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

// Following/saved feeds, likes, comments and saves need a platform user (brand tokens have none)
const onlyUsers = (req, res, next) =>
  req.user ? next() : res.status(403).json({ message: 'Only users can do this' });
const user = [protect, onlyUsers];

// Feeds (fixed paths before /:id)
router.get('/', optionalProtect, getFeed); // public — login sirf "maine like kiya?" ke liye
router.get('/following', ...user, getFollowingFeed);
router.get('/coaches', optionalProtect, getCoachesFeed);
router.get('/saved', ...user, getSavedPosts);

router.post('/', protect, uploadImages, createPost);

// One post
router.get('/:id', optionalProtect, getPost);
router.delete('/:id', ...user, deletePost);
router.post('/:id/like', ...user, likePost);
router.delete('/:id/like', ...user, unlikePost);
router.post('/:id/save', ...user, savePost);
router.delete('/:id/save', ...user, unsavePost);
router.get('/:id/comments', optionalProtect, getComments);
router.get('/:id/comments/:commentId/replies', optionalProtect, getReplies);
router.post('/:id/comments', ...user, addComment);
router.delete('/:id/comments/:commentId', ...user, deleteComment);

module.exports = router;
