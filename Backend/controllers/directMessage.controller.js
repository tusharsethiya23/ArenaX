// directMessage.controller.js
// Private messages. Allowed when the two users follow each other in at least
// one direction (an accepted follow, not a pending request), or when a buyer
// contacts the seller of an active marketplace listing ("Contact seller");
// a conversation that started about a listing can then carry on both ways.
//   GET  /api/dm           inbox: one row per person, latest message + unread count
//   GET  /api/dm/:userId?listing=<id>   that conversation (marks their messages to me
//                                       as read); listing: the item being asked about
//   POST /api/dm/:userId   send { text, listing? }
// New messages are pushed over Socket.io to the `user:<id>` rooms of both people.

const mongoose = require('mongoose');
const DirectMessage = require('../models/directMessage.model');
const Follow = require('../models/follow.model');
const User = require('../models/user.model');
const Listing = require('../models/listing.model');

const { ACCEPTED } = Follow;
const PERSON_FIELDS = 'name profilePhoto role sport location';
const HISTORY_LIMIT = 200;

const isId = (id) => mongoose.Types.ObjectId.isValid(id);

// The listing being asked about, if it's an active listing of `seller`
const sellerListing = async (listingId, seller) => (isId(listingId)
  ? Listing.findOne({ _id: listingId, seller, status: 'active' }).select('title photos status').lean()
  : null);

// me -> other is allowed: a follow either way, contacting other about their
// active listing, or carrying on a conversation that started about a listing
const canMessage = async (me, other, listing = null) => {
  if (listing) return true;
  if (await Follow.exists({ $or: [{ follower: me, following: other }, { follower: other, following: me }], ...ACCEPTED })) return true;
  return Boolean(await DirectMessage.exists({ $or: [{ from: me, to: other }, { from: other, to: me }], listing: { $ne: null } }));
};

const listingSummary = (l) => l && { _id: l._id, title: l.title, photo: l.photos?.[0] || '', status: l.status };

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

    const listing = await sellerListing(req.query.listing, userId);
    const [allowed, messages] = await Promise.all([
      String(userId) === String(me) ? false : canMessage(me, userId, listing),
      DirectMessage.find({ $or: [{ from: me, to: userId }, { from: userId, to: me }] })
        .sort({ createdAt: -1 })
        .limit(HISTORY_LIMIT)
        .populate('listing', 'title photos status')
        .lean(),
    ]);
    await DirectMessage.updateMany({ from: userId, to: me, readAt: null }, { readAt: new Date() });

    res.json({
      user: other,
      canMessage: Boolean(allowed),
      listing: listingSummary(listing),
      messages: messages.reverse().map((m) => ({ ...m, listing: listingSummary(m.listing) })),
    });
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
    const listing = req.body.listing ? await sellerListing(req.body.listing, userId) : null;
    if (req.body.listing && !listing) return res.status(400).json({ message: 'This listing is no longer available' });
    if (!(await canMessage(me, userId, listing))) {
      return res.status(403).json({ message: 'You can message people you follow or who follow you' });
    }

    const message = await DirectMessage.create({ from: me, to: userId, text, listing: listing?._id || null });
    // fromUser: so the receiver's app can say who wrote without another request
    const payload = { ...message.toObject(), listing: listingSummary(listing), fromUser: { _id: me, name: req.user.name, profilePhoto: req.user.profilePhoto } };
    const io = req.app.get('io');
    io?.to(`user:${userId}`).to(`user:${me}`).emit('dm', payload);
    res.status(201).json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getInbox, getConversation, sendDirectMessage };
