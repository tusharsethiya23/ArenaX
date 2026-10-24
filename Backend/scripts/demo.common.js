// demo.common.js
// Shared by demo.seed.js and demo.clear.js.
// Every demo account has an email ending in @demo.arenax, and all demo data
// hangs off those accounts, so it can be found and removed without touching
// real users or their content.

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });
const mongoose = require('mongoose');
const { deleteUsersAndData } = require('../utils/accountDeletion.util');

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
const Tournament = require('../models/tournament.model');
const Team = require('../models/team.model');
const Assessment = require('../models/assessment.model');
const ActivityLog = require('../models/activityLog.model');

const DEMO_DOMAIN = 'demo.arenax';
const DEMO_EMAIL = /@demo\.arenax$/i;

const connect = async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set in Backend/.env');
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected to database "${mongoose.connection.name}"`);
};

const demoUserIds = () => User.find({ email: DEMO_EMAIL }).distinct('_id');

// Deletes every demo account and everything linked to it (same rules as a
// real account deletion, see utils/accountDeletion.util.js)
const clearDemoData = async () => deleteUsersAndData(await demoUserIds());

module.exports = {
  mongoose, connect, clearDemoData, demoUserIds, DEMO_DOMAIN, DEMO_EMAIL,
  models: {
    User, Post, Comment, SavedPost, Follow, Booking, Message, Review, Achievement,
    Endorsement, ProfileView, Subscription, Content, Purchase, Tournament, Team, Assessment, ActivityLog,
  },
};
