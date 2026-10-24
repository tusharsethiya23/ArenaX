// demo.common.js
// Shared by demo.seed.js and demo.clear.js.
// Every demo account has an email ending in @demo.arenax, and all demo data
// hangs off those accounts, so it can be found and removed without touching
// real users or their content.

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });
const mongoose = require('mongoose');

const User = require('../models/user.model');
const Post = require('../models/post.model');
const Comment = require('../models/comment.model');
const SavedPost = require('../models/savedPost.model');
const Follow = require('../models/follow.model');
const Booking = require('../models/booking.model');
const Message = require('../models/message.model');
const Review = require('../models/review.model');
const Achievement = require('../models/achievement.model');
const Endorsement = require('../models/endorsement.model');
const ProfileView = require('../models/profileView.model');
const Subscription = require('../models/subscription.model');
const Content = require('../models/content.model');
const Purchase = require('../models/purchase.model');
const Deal = require('../models/deal.model');
const Spotlight = require('../models/spotlight.model');
const Tournament = require('../models/tournament.model');
const Team = require('../models/team.model');

const DEMO_DOMAIN = 'demo.arenax';
const DEMO_EMAIL = /@demo\.arenax$/i;

const connect = async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set in Backend/.env');
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected to database "${mongoose.connection.name}"`);
};

const demoUserIds = () => User.find({ email: DEMO_EMAIL }).distinct('_id');

// Deletes every demo account and everything that belongs to or points at one.
// Returns a summary of what was removed.
const clearDemoData = async () => {
  const ids = await demoUserIds();
  if (ids.length === 0) return { users: 0 };
  const inIds = { $in: ids };

  const postIds = await Post.find({ author: inIds }).distinct('_id');
  const bookingIds = await Booking.find({ $or: [{ learner: inIds }, { coach: inIds }] }).distinct('_id');
  const contentIds = await Content.find({ coach: inIds }).distinct('_id');
  const tournamentIds = await Tournament.find({ createdBy: inIds }).distinct('_id');
  // Posts outside the demo set that lose demo comments need their counts fixed
  const otherCommented = await Comment.find({ author: inIds, post: { $nin: postIds } }).distinct('post');

  const counts = {};
  const run = async (label, promise) => { counts[label] = (await promise).deletedCount ?? 0; };

  await run('posts', Post.deleteMany({ _id: { $in: postIds } }));
  await run('comments', Comment.deleteMany({ $or: [{ post: { $in: postIds } }, { author: inIds }] }));
  await run('savedPosts', SavedPost.deleteMany({ $or: [{ post: { $in: postIds } }, { user: inIds }] }));
  await run('follows', Follow.deleteMany({ $or: [{ follower: inIds }, { following: inIds }] }));
  await run('messages', Message.deleteMany({ $or: [{ booking: { $in: bookingIds } }, { sender: inIds }, { receiver: inIds }] }));
  await run('reviews', Review.deleteMany({ $or: [{ booking: { $in: bookingIds } }, { coach: inIds }, { learner: inIds }] }));
  await run('bookings', Booking.deleteMany({ _id: { $in: bookingIds } }));
  await run('achievements', Achievement.deleteMany({ user: inIds }));
  await run('endorsements', Endorsement.deleteMany({ $or: [{ endorser: inIds }, { endorsedUser: inIds }] }));
  await run('profileViews', ProfileView.deleteMany({ profileOwner: inIds }));
  await run('subscriptions', Subscription.deleteMany({ user: inIds }));
  await run('purchases', Purchase.deleteMany({ $or: [{ content: { $in: contentIds } }, { learner: inIds }] }));
  await run('content', Content.deleteMany({ _id: { $in: contentIds } }));
  await run('deals', Deal.deleteMany({ talent: inIds }));
  await run('spotlights', Spotlight.deleteMany({ athlete: inIds }));
  await run('teams', Team.deleteMany({ $or: [{ tournament: { $in: tournamentIds } }, { captain: inIds }] }));
  await run('tournaments', Tournament.deleteMany({ _id: { $in: tournamentIds } }));
  await Team.updateMany({ members: inIds }, { $pull: { members: inIds } });

  // Remove demo likes from any remaining post and recount
  await Post.updateMany({ likes: inIds }, [
    { $set: { likes: { $setDifference: ['$likes', ids] } } },
    { $set: { likeCount: { $size: '$likes' } } },
  ], { updatePipeline: true });
  for (const postId of otherCommented) {
    await Post.updateOne({ _id: postId }, { commentCount: await Comment.countDocuments({ post: postId }) });
  }

  await run('users', User.deleteMany({ _id: inIds }));
  return counts;
};

module.exports = {
  mongoose, connect, clearDemoData, demoUserIds, DEMO_DOMAIN, DEMO_EMAIL,
  models: {
    User, Post, Comment, SavedPost, Follow, Booking, Message, Review, Achievement,
    Endorsement, ProfileView, Subscription, Content, Purchase, Tournament, Team,
  },
};
