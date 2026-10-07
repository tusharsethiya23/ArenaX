// user.routes.js
// Defines all user-related API endpoints: coach discovery, profile management,
// photo upload, and admin-only user management.

const express = require('express');
const router = express.Router();

const {
  getCoaches,
  updateProfile,
  uploadProfilePhoto,
  getUserById,
  deleteAccount,
  getAllUsers,
  adminDeleteUser,
  getRecommendedCoaches
} = require('../controllers/userController');

const { protect } = require('../middlewares/auth.middleware');
const { adminOnly } = require('../middlewares/admin.middleware');
const upload = require('../middlewares/upload.middleware');

// Public routes
router.get('/coaches', getCoaches);

// Admin-only routes — must come BEFORE '/:id', otherwise Express would
// treat "admin" as if it were an :id value
router.get('/admin/all', protect, adminOnly, getAllUsers);
router.delete('/admin/:id', protect, adminOnly, adminDeleteUser);

router.get('/recommended', protect, getRecommendedCoaches);

// Public — get any single user's profile by ID (used for public profile view)
router.get('/:id', getUserById);

// Protected — logged-in user's own profile actions
router.put('/profile', protect, updateProfile);
router.post('/profile/photo', protect, upload.single('photo'), uploadProfilePhoto);
router.delete('/profile', protect, deleteAccount);

module.exports = router;