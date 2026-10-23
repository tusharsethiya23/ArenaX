const mongoose = require('mongoose');
const Post = require('../models/post.model');
const imagekit = require('../config/imagekit.config');

const { MAX_TEXT_LENGTH, MAX_IMAGES } = Post;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 20;
const AUTHOR_FIELDS = 'name profilePhoto role sport';

// Create a post with optional text and up to MAX_IMAGES images (multipart/form-data)
const createPost = async (req, res) => {
  try {
    // `protect` also lets brand tokens through — only platform users can post
    if (!req.user) {
      return res.status(403).json({ message: 'Only users can create posts' });
    }

    const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
    const files = req.files || [];

    if (!text && files.length === 0) {
      return res.status(400).json({ message: 'Post must have text or at least one image' });
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({ message: `Post text can be at most ${MAX_TEXT_LENGTH} characters` });
    }

    // Validate everything above before uploading, so bad requests don't leave files on ImageKit
    const uploads = await Promise.all(files.map((file, i) =>
      imagekit.upload({
        file: file.buffer.toString('base64'),
        fileName: `post_${req.user._id}_${Date.now()}_${i}`,
        folder: '/arenax_posts',
      })
    ));

    const post = await Post.create({
      author: req.user._id,
      text,
      images: uploads.map((u) => u.url),
    });
    await post.populate('author', AUTHOR_FIELDS);

    res.status(201).json(post);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// Feed: newest first, cursor-paginated.
// GET /api/posts?limit=10&cursor=<_id of the last post you already have>
// Cursor (not page numbers) so new posts arriving don't cause duplicates while scrolling.
const getFeed = async (req, res) => {
  try {
    const { cursor } = req.query;
    let limit = parseInt(req.query.limit, 10);
    if (!Number.isInteger(limit) || limit < 1) limit = DEFAULT_PAGE_SIZE;
    limit = Math.min(limit, MAX_PAGE_SIZE);

    const filter = {};
    if (cursor) {
      if (!mongoose.Types.ObjectId.isValid(cursor)) {
        return res.status(400).json({ message: 'Invalid cursor' });
      }
      filter._id = { $lt: cursor };
    }

    // Fetch one extra to know whether another page exists
    const posts = await Post.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate('author', AUTHOR_FIELDS);

    const hasMore = posts.length > limit;
    if (hasMore) posts.pop();

    res.json({
      posts,
      nextCursor: hasMore ? posts[posts.length - 1]._id : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createPost, getFeed, MAX_IMAGES };
