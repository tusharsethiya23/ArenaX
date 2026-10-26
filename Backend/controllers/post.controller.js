const mongoose = require('mongoose');
const Post = require('../models/post.model');
const Comment = require('../models/comment.model');
const SavedPost = require('../models/savedPost.model');
const Follow = require('../models/follow.model');
const User = require('../models/user.model');
const imagekit = require('../config/imagekit.config');
const { awardPoints, revokePoints } = require('../utils/points.util');
const { verifiedIdSet } = require('../utils/coachVerification.util');

const { MAX_TEXT_LENGTH, MAX_IMAGES, MAX_LOCATION_LENGTH } = Post;
const { MAX_COMMENT_LENGTH } = Comment;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 20;
const AUTHOR_FIELDS = 'name profilePhoto role sport location foundingMember coachVerified';
const COMMENT_AUTHOR_FIELDS = 'name profilePhoto role';

const isId = (id) => mongoose.Types.ObjectId.isValid(id);

// ---------- Private accounts ----------
// A private account's posts are only visible to the author, their accepted
// followers, and admins.

// Authors whose posts the viewer may NOT see
const hiddenAuthors = async (viewer) => {
  const privateIds = await User.find({ isPrivate: true }).distinct('_id');
  if (!privateIds.length || viewer?.role === 'admin') return [];
  const allowed = new Set(viewer
    ? (await Follow.find({ follower: viewer._id, following: { $in: privateIds }, ...Follow.ACCEPTED }).distinct('following')).map(String)
    : []);
  if (viewer) allowed.add(String(viewer._id));
  return privateIds.filter((id) => !allowed.has(String(id)));
};

const canSeeAuthor = async (authorId, viewer) => {
  if (viewer && (viewer._id.equals(authorId) || viewer.role === 'admin')) return true;
  const author = await User.findById(authorId).select('isPrivate');
  if (!author?.isPrivate) return true;
  return Boolean(viewer) && Boolean(await Follow.exists({ follower: viewer._id, following: authorId, ...Follow.ACCEPTED }));
};

const pageLimit = (raw) => {
  const limit = parseInt(raw, 10);
  return Math.min(Number.isInteger(limit) && limit > 0 ? limit : DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
};

// Adds what the feed shows for each post, in a few bulk queries for the whole page:
// isLiked / isSaved (for the logged-in user), the latest comment, and author.verified
// (coaches: earned from sessions and ratings; others: a verified achievement).
const decoratePosts = async (posts, viewer) => {
  if (posts.length === 0) return [];
  const ids = posts.map((p) => p._id);
  const [liked, saved, latest, verifiedSet] = await Promise.all([
    viewer ? Post.find({ _id: { $in: ids }, likes: viewer._id }).distinct('_id') : [],
    viewer ? SavedPost.find({ user: viewer._id, post: { $in: ids } }).distinct('post') : [],
    Comment.aggregate([
      { $match: { post: { $in: ids }, parent: null } }, // preview shows top-level comments only
      { $sort: { _id: -1 } },
      { $group: { _id: '$post', comment: { $first: '$$ROOT' } } },
    ]),
    verifiedIdSet(posts.map((p) => p.author)),
  ]);

  // Load the latest comments' authors
  const latestComments = await Comment.populate(latest.map((l) => l.comment), { path: 'author', select: COMMENT_AUTHOR_FIELDS });
  const latestByPost = Object.fromEntries(latestComments.map((c) => [String(c.post), c]));
  const likedSet = new Set(liked.map(String));
  const savedSet = new Set(saved.map(String));

  return posts.map((p) => ({
    ...p,
    author: p.author ? { ...p.author, coachVerified: undefined, verified: verifiedSet.has(String(p.author._id)) } : null,
    isLiked: likedSet.has(String(p._id)),
    isSaved: savedSet.has(String(p._id)),
    latestComment: latestByPost[String(p._id)] || null,
  }));
};

// Create a post with optional text, location and up to MAX_IMAGES images (multipart/form-data)
const createPost = async (req, res) => {
  try {
    // `protect` also lets brand tokens through — only platform users can post
    if (!req.user) {
      return res.status(403).json({ message: 'Only users can create posts' });
    }

    const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
    const location = typeof req.body.location === 'string' ? req.body.location.trim() : '';
    const files = req.files || [];

    if (!text && files.length === 0) {
      return res.status(400).json({ message: 'Post must have text or at least one image' });
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({ message: `Post text can be at most ${MAX_TEXT_LENGTH} characters` });
    }
    if (location.length > MAX_LOCATION_LENGTH) {
      return res.status(400).json({ message: `Location can be at most ${MAX_LOCATION_LENGTH} characters` });
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
      location,
      images: uploads.map((u) => u.url),
    });
    await awardPoints(req.user._id, 'post', post._id); // +5 Arena Points
    const populated = await Post.findById(post._id).populate('author', AUTHOR_FIELDS).lean();
    const [decorated] = await decoratePosts([populated], req.user);

    res.status(201).json(decorated);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// Feed, cursor-paginated so new posts arriving don't cause duplicates while scrolling.
// GET /api/posts[/following|/coaches]?limit=10&sort=latest|popular&cursor=...
//   latest  (default): newest first; cursor = _id of the last post you have
//   popular:           most liked first; cursor = "<likeCount>_<_id>" of the last post
// `getBaseFilter(req)` narrows which posts are included.
const feedHandler = (getBaseFilter) => async (req, res) => {
  try {
    const { cursor } = req.query;
    const popular = req.query.sort === 'popular';
    const limit = pageLimit(req.query.limit);

    // Base filter (which feed) AND not by a private account the viewer can't see
    const filter = { $and: [await getBaseFilter(req), { author: { $nin: await hiddenAuthors(req.user) } }] };
    if (cursor) {
      if (popular) {
        const [count, id] = String(cursor).split('_');
        if (!/^\d+$/.test(count) || !isId(id)) return res.status(400).json({ message: 'Invalid cursor' });
        filter.$or = [
          { likeCount: { $lt: Number(count) } },
          { likeCount: Number(count), _id: { $lt: new mongoose.Types.ObjectId(id) } },
        ];
      } else {
        if (!isId(cursor)) return res.status(400).json({ message: 'Invalid cursor' });
        filter._id = { $lt: cursor };
      }
    }

    // Fetch one extra to know whether another page exists
    const posts = await Post.find(filter)
      .sort(popular ? { likeCount: -1, _id: -1 } : { _id: -1 })
      .limit(limit + 1)
      .populate('author', AUTHOR_FIELDS)
      .lean();

    const hasMore = posts.length > limit;
    if (hasMore) posts.pop();
    const last = posts[posts.length - 1];

    res.json({
      posts: await decoratePosts(posts, req.user),
      nextCursor: hasMore ? (popular ? `${last.likeCount}_${last._id}` : last._id) : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/posts — posts from everyone
const getFeed = feedHandler(async () => ({}));

// GET /api/posts/following — only posts by people the logged-in user follows
const getFollowingFeed = feedHandler(async (req) => {
  const follows = await Follow.find({ follower: req.user._id, ...Follow.ACCEPTED }).select('following');
  return { author: { $in: follows.map((f) => f.following) } };
});

// GET /api/posts/coaches — only posts by coaches
const getCoachesFeed = feedHandler(async () => ({
  author: { $in: await User.find({ role: 'coach' }).distinct('_id') },
}));

// GET /api/posts/saved — the logged-in user's saved posts, most recently saved first.
// Cursor = _id of the save record (`savedId` on each post).
const getSavedPosts = async (req, res) => {
  try {
    const { cursor } = req.query;
    const limit = pageLimit(req.query.limit);
    const filter = { user: req.user._id };
    if (cursor) {
      if (!isId(cursor)) return res.status(400).json({ message: 'Invalid cursor' });
      filter._id = { $lt: cursor };
    }

    const saves = await SavedPost.find(filter).sort({ _id: -1 }).limit(limit + 1).lean();
    const hasMore = saves.length > limit;
    if (hasMore) saves.pop();

    const posts = await Post.find({ _id: { $in: saves.map((s) => s.post) }, author: { $nin: await hiddenAuthors(req.user) } })
      .populate('author', AUTHOR_FIELDS).lean();
    const byId = Object.fromEntries(posts.map((p) => [String(p._id), p]));
    // Keep saved order; skip saves whose post was deleted
    const ordered = saves.filter((s) => byId[String(s.post)]).map((s) => ({ ...byId[String(s.post)], savedId: s._id }));

    res.json({
      posts: await decoratePosts(ordered, req.user),
      nextCursor: hasMore ? saves[saves.length - 1]._id : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Loads a post by :id or sends 400/404. Returns the post or null.
const findPostOr404 = async (req, res) => {
  if (!isId(req.params.id)) {
    res.status(400).json({ message: 'Invalid post id' });
    return null;
  }
  const post = await Post.findById(req.params.id);
  // Posts from private accounts look "not found" to people who can't see them
  if (!post || !(await canSeeAuthor(post.author, req.user))) {
    res.status(404).json({ message: 'Post not found' });
    return null;
  }
  return post;
};

// GET /api/posts/:id — one post (for shared links)
const getPost = async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid post id' });
    const post = await Post.findById(req.params.id).populate('author', AUTHOR_FIELDS).lean();
    if (!post || !(await canSeeAuthor(post.author?._id || post.author, req.user))) {
      return res.status(404).json({ message: 'Post not found' });
    }
    const [decorated] = await decoratePosts([post], req.user);
    res.json(decorated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/posts/:id — the author (or an admin) removes a post, with its comments and saves
const deletePost = async (req, res) => {
  try {
    const post = await findPostOr404(req, res);
    if (!post) return;
    if (!post.author.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }
    await Promise.all([
      Post.deleteOne({ _id: post._id }),
      Comment.deleteMany({ post: post._id }),
      SavedPost.deleteMany({ post: post._id }),
      revokePoints(post.author, 'post', post._id), // the post's points go too
    ]);
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST/DELETE /api/posts/:id/like — idempotent; the conditional update means
// double-clicks or two tabs can't count a like twice or go below zero
const setLike = (like) => async (req, res) => {
  try {
    if (!(await findPostOr404(req, res))) return;
    const me = req.user._id;
    if (like) {
      await Post.updateOne({ _id: req.params.id, likes: { $ne: me } }, { $push: { likes: me }, $inc: { likeCount: 1 } });
    } else {
      await Post.updateOne({ _id: req.params.id, likes: me }, { $pull: { likes: me }, $inc: { likeCount: -1 } });
    }
    const post = await Post.findById(req.params.id).select('likeCount');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json({ isLiked: like, likeCount: post.likeCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST/DELETE /api/posts/:id/save — idempotent bookmark
const setSaved = (save) => async (req, res) => {
  try {
    const post = await findPostOr404(req, res);
    if (!post) return;
    if (save) {
      await SavedPost.updateOne(
        { user: req.user._id, post: post._id },
        { $setOnInsert: { user: req.user._id, post: post._id } },
        { upsert: true }
      ).catch((e) => { if (e.code !== 11000) throw e; }); // a simultaneous save is fine
    } else {
      await SavedPost.deleteOne({ user: req.user._id, post: post._id });
    }
    res.json({ isSaved: save });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/posts/:id/comments?cursor= — top-level comments, newest first, 20 at a time
// (each has replyCount; replies are loaded per comment with getReplies)
const getComments = async (req, res) => {
  try {
    if (!(await findPostOr404(req, res))) return;
    const { cursor } = req.query;
    const filter = { post: req.params.id, parent: null };
    if (cursor) {
      if (!isId(cursor)) return res.status(400).json({ message: 'Invalid cursor' });
      filter._id = { $lt: cursor };
    }
    const limit = 20;
    const comments = await Comment.find(filter).sort({ _id: -1 }).limit(limit + 1).populate('author', COMMENT_AUTHOR_FIELDS);
    const hasMore = comments.length > limit;
    if (hasMore) comments.pop();
    res.json({ comments, nextCursor: hasMore ? comments[comments.length - 1]._id : null });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/posts/:id/comments/:commentId/replies?cursor= — oldest first, 20 at a time
const getReplies = async (req, res) => {
  try {
    if (!isId(req.params.commentId)) return res.status(400).json({ message: 'Invalid id' });
    if (!(await findPostOr404(req, res))) return;
    const filter = { post: req.params.id, parent: req.params.commentId };
    const { cursor } = req.query;
    if (cursor) {
      if (!isId(cursor)) return res.status(400).json({ message: 'Invalid cursor' });
      filter._id = { $gt: cursor };
    }
    const limit = 20;
    const replies = await Comment.find(filter).sort({ _id: 1 }).limit(limit + 1)
      .populate('author', COMMENT_AUTHOR_FIELDS)
      .populate('replyTo', 'name');
    const hasMore = replies.length > limit;
    if (hasMore) replies.pop();
    res.json({ replies, nextCursor: hasMore ? replies[replies.length - 1]._id : null });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/posts/:id/comments — { text, parentId? }
// With parentId it's a reply. Replying to a reply joins that reply's thread
// and mentions its author (replyTo).
const addComment = async (req, res) => {
  try {
    const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
    if (!text) return res.status(400).json({ message: 'Comment cannot be empty' });
    if (text.length > MAX_COMMENT_LENGTH) {
      return res.status(400).json({ message: `Comments can be at most ${MAX_COMMENT_LENGTH} characters` });
    }
    const post = await findPostOr404(req, res);
    if (!post) return;

    let parent = null;
    let replyTo = null;
    if (req.body.parentId) {
      if (!isId(req.body.parentId)) return res.status(400).json({ message: 'Invalid comment' });
      const target = await Comment.findOne({ _id: req.body.parentId, post: post._id });
      if (!target) return res.status(404).json({ message: 'That comment was deleted' });
      parent = target.parent || target._id;
      replyTo = target.author;
    }

    const comment = await Comment.create({ post: post._id, author: req.user._id, text, parent, replyTo });
    const { commentCount } = await Post.findByIdAndUpdate(post._id, { $inc: { commentCount: 1 } }, { new: true }).select('commentCount');
    const replyCount = parent
      ? (await Comment.findByIdAndUpdate(parent, { $inc: { replyCount: 1 } }, { new: true }).select('replyCount'))?.replyCount
      : undefined;
    await comment.populate([{ path: 'author', select: COMMENT_AUTHOR_FIELDS }, { path: 'replyTo', select: 'name' }]);
    res.status(201).json({ comment, commentCount, replyCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/posts/:id/comments/:commentId — comment author, post author, or admin.
// Deleting a top-level comment also deletes its replies.
const deleteComment = async (req, res) => {
  try {
    if (!isId(req.params.id) || !isId(req.params.commentId)) {
      return res.status(400).json({ message: 'Invalid id' });
    }
    const comment = await Comment.findOne({ _id: req.params.commentId, post: req.params.id });
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const post = await Post.findById(req.params.id).select('author');
    const allowed = comment.author.equals(req.user._id)
      || post?.author.equals(req.user._id)
      || req.user.role === 'admin';
    if (!allowed) return res.status(403).json({ message: 'You cannot delete this comment' });

    let removed = 1;
    let replyCount;
    if (comment.parent) {
      await Comment.deleteOne({ _id: comment._id });
      replyCount = (await Comment.findOneAndUpdate(
        { _id: comment.parent, replyCount: { $gt: 0 } },
        { $inc: { replyCount: -1 } },
        { new: true },
      ).select('replyCount'))?.replyCount ?? 0;
    } else {
      removed += (await Comment.deleteMany({ parent: comment._id })).deletedCount;
      await Comment.deleteOne({ _id: comment._id });
    }

    const updated = await Post.findByIdAndUpdate(
      req.params.id,
      [{ $set: { commentCount: { $max: [0, { $subtract: ['$commentCount', removed] }] } } }],
      { new: true, updatePipeline: true },
    ).select('commentCount');
    res.json({ message: 'Comment deleted', commentCount: updated?.commentCount ?? 0, replyCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPost, getFeed, getFollowingFeed, getCoachesFeed, getSavedPosts, getPost, deletePost,
  likePost: setLike(true), unlikePost: setLike(false),
  savePost: setSaved(true), unsavePost: setSaved(false),
  getComments, getReplies, addComment, deleteComment,
  MAX_IMAGES,
};
