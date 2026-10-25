// directMessage.controller.js
// Private messages between users who follow each other in at least one
// direction (an accepted follow, not a pending request).
//   GET  /api/dm           inbox: one row per person, latest message + unread count
//   GET  /api/dm/:userId   that conversation (marks their messages to me as read)
//   POST /api/dm/:userId   send { text }
// New messages are pushed over Socket.io to the `user:<id>` rooms of both people.

const mongoose = require('mongoose');
const DirectMessage = require('../models/directMessage.model');
const Follow = require('../models/follow.model');
const User = require('../models/user.model');

const { ACCEPTED } = Follow;
const PERSON_FIELDS = 'name profilePhoto role sport location';
const HISTORY_LIMIT = 200;

const canMessage = (a, b) => Follow.exists({
  $or: [{ follower: a, following: b }, { follower: b, following: a }],
  ...ACCEPTED,
});

const isId = (id) => mongoose.Types.ObjectId.isValid(id);

const getInbox = async (req, res) => {
  try {
    const me = req.user._id;
    const rows = await DirectMessage.aggregate([
      { $match: { $or: [{ from: me }, { to: me }] } },
      { $sort: { createdAt: -1 } },
      { $addFields: { other: { $cond: [{ $eq: ['$from', me] }, '$to', '$from'] } } },
      {
        $group: {
          _id: '$other',
          last: { $first: '$$ROOT' },
          unread: { $sum: { $cond: [{ $and: [{ $eq: ['$to', me] }, { $eq: ['$readAt', null] }] }, 1, 0] } },
        },
      },
      { $sort: { 'last.createdAt': -1 } },
      { $limit: 100 },
    ]);
    const people = await User.find({ _id: { $in: rows.map((r) => r._id) } }).select(PERSON_FIELDS).lean();
    const byId = new Map(people.map((p) => [String(p._id), p]));
    res.json(rows
      .filter((r) => byId.has(String(r._id))) // skip deleted accounts
      .map((r) => ({
        user: byId.get(String(r._id)),
        lastMessage: { text: r.last.text, createdAt: r.last.createdAt, mine: String(r.last.from) === String(me) },
        unread: r.unread,
      })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getConversation = async (req, res) => {
  try {
    const me = req.user._id;
    const { userId } = req.params;
    if (!isId(userId)) return res.status(404).json({ message: 'User not found' });
    const other = await User.findById(userId).select(PERSON_FIELDS).lean();
    if (!other) return res.status(404).json({ message: 'User not found' });

    const [allowed, messages] = await Promise.all([
      String(userId) === String(me) ? false : canMessage(me, userId),
      DirectMessage.find({ $or: [{ from: me, to: userId }, { from: userId, to: me }] })
        .sort({ createdAt: -1 })
        .limit(HISTORY_LIMIT)
        .lean(),
    ]);
    await DirectMessage.updateMany({ from: userId, to: me, readAt: null }, { readAt: new Date() });

    res.json({ user: other, canMessage: Boolean(allowed), messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendDirectMessage = async (req, res) => {
  try {
    const me = req.user._id;
    const { userId } = req.params;
    const text = String(req.body.text || '').trim();
    if (!text) return res.status(400).json({ message: 'Write a message first' });
    if (text.length > 2000) return res.status(400).json({ message: 'Messages can be up to 2000 characters' });
    if (!isId(userId) || String(userId) === String(me)) return res.status(400).json({ message: 'You can\'t message this user' });
    if (!(await User.exists({ _id: userId }))) return res.status(404).json({ message: 'User not found' });
    if (!(await canMessage(me, userId))) {
      return res.status(403).json({ message: 'You can message people you follow or who follow you' });
    }

    const message = await DirectMessage.create({ from: me, to: userId, text });
    // fromUser: so the receiver's app can say who wrote without another request
    const payload = { ...message.toObject(), fromUser: { _id: me, name: req.user.name, profilePhoto: req.user.profilePhoto } };
    const io = req.app.get('io');
    io?.to(`user:${userId}`).to(`user:${me}`).emit('dm', payload);
    res.status(201).json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getInbox, getConversation, sendDirectMessage };
