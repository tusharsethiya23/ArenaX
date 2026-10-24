// accountDeletion.util.js
// Deletes user accounts and everything linked to them. Used by "Delete my
// account", admin deletion, and the demo-data cleaner.
//
// Removed: the user; their posts (with comments and saves on them), comments
// (and replies under them),
// likes and saves; follows both ways; bookings they were in, with those
// bookings' chat messages and reviews; reviews they wrote or received;
// achievements; Athlete DNA (assessments of them or by them, activity logs);
// endorsements given or received; profile views; subscriptions; their
// marketplace content and its purchases, and their own purchases; brand deals
// and spotlights; tournaments they created (with their teams) and teams they
// captain; and they're taken off other teams.
//
// Other people's achievements keep their history:
//   - verified by a deleted coach: stays verified (shown as "a former coach")
//   - waiting for a deleted coach: goes back to unverified so the athlete can ask someone else
//
// Not handled here: uploaded image files stay with ImageKit (only their URLs
// are stored, so there's no file id to delete them by).

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
const Assessment = require('../models/assessment.model');
const ActivityLog = require('../models/activityLog.model');

// Deletes the given user ids and their data. Returns { collection: deletedCount }.
const deleteUsersAndData = async (userIds) => {
  const ids = userIds.map(String);
  if (ids.length === 0) return { users: 0 };
  const inIds = { $in: userIds };

  const postIds = await Post.find({ author: inIds }).distinct('_id');
  const bookingIds = await Booking.find({ $or: [{ learner: inIds }, { coach: inIds }] }).distinct('_id');
  const contentIds = await Content.find({ coach: inIds }).distinct('_id');
  const tournamentIds = await Tournament.find({ createdBy: inIds }).distinct('_id');
  // Posts by other people that lose comments need their counts fixed afterwards
  const otherCommented = await Comment.find({ author: inIds, post: { $nin: postIds } }).distinct('post');
  // Their comments (replies under them go too) and threads losing their replies
  const theirCommentIds = await Comment.find({ author: inIds }).distinct('_id');
  const threadsLosingReplies = await Comment.find({ author: inIds, parent: { $ne: null } }).distinct('parent');

  const counts = {};
  const run = async (label, promise) => { counts[label] = (await promise).deletedCount ?? 0; };

  await run('posts', Post.deleteMany({ _id: { $in: postIds } }));
  await run('comments', Comment.deleteMany({ $or: [{ post: { $in: postIds } }, { author: inIds }, { parent: { $in: theirCommentIds } }] }));
  await run('savedPosts', SavedPost.deleteMany({ $or: [{ post: { $in: postIds } }, { user: inIds }] }));
  await run('follows', Follow.deleteMany({ $or: [{ follower: inIds }, { following: inIds }] }));
  await run('messages', Message.deleteMany({ $or: [{ booking: { $in: bookingIds } }, { sender: inIds }, { receiver: inIds }] }));
  await run('reviews', Review.deleteMany({ $or: [{ booking: { $in: bookingIds } }, { coach: inIds }, { learner: inIds }] }));
  await run('bookings', Booking.deleteMany({ _id: { $in: bookingIds } }));
  await run('achievements', Achievement.deleteMany({ user: inIds }));
  await run('assessments', Assessment.deleteMany({ $or: [{ athlete: inIds }, { assessor: inIds }] }));
  await run('activityLogs', ActivityLog.deleteMany({ athlete: inIds }));
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

  // Other athletes' achievements verified by, or waiting for, a deleted coach
  await Achievement.updateMany(
    { status: 'verified', verifiedBy: inIds },
    { $set: { verifiedBy: null, verifierRemoved: true } },
  );
  await Achievement.updateMany(
    { status: 'pending', requestedFrom: inIds },
    { $set: { status: 'unverified', requestedFrom: null } },
  );

  // Remove their likes from remaining posts and recount
  await Post.updateMany({ likes: inIds }, [
    { $set: { likes: { $setDifference: ['$likes', userIds] } } },
    { $set: { likeCount: { $size: '$likes' } } },
  ], { updatePipeline: true });
  for (const postId of otherCommented) {
    await Post.updateOne({ _id: postId }, { commentCount: await Comment.countDocuments({ post: postId }) });
  }
  for (const parentId of threadsLosingReplies) {
    await Comment.updateOne({ _id: parentId }, { replyCount: await Comment.countDocuments({ parent: parentId }) });
  }

  await run('users', User.deleteMany({ _id: inIds }));
  return counts;
};

module.exports = { deleteUsersAndData };
