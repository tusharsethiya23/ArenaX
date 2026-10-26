// listing.controller.js
// Marketplace listings: photo(s), title, description, condition and location.
// No prices or checkout: "Contact seller" opens a direct message about the
// listing (see directMessage.controller.js).
//   GET    /api/listings?q=&condition=&mine=1   active listings, newest first (mine=1: my own, sold too)
//   GET    /api/listings/:id
//   POST   /api/listings          multipart: photos (1-4) + title, description, condition, location
//   PATCH  /api/listings/:id      { status: 'active' | 'sold' } (seller or admin)
//   DELETE /api/listings/:id      (seller or admin)

const mongoose = require('mongoose');
const Listing = require('../models/listing.model');
const imagekit = require('../config/imagekit.config');

const { CONDITIONS, MAX_PHOTOS } = Listing;
const SELLER_FIELDS = 'name profilePhoto role sport location foundingMember';
const isId = (id) => mongoose.Types.ObjectId.isValid(id);
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const text = (v) => (typeof v === 'string' ? v.trim() : '');

const listListings = async (req, res) => {
  try {
    const filter = req.query.mine === '1' && req.user ? { seller: req.user._id } : { status: 'active' };
    if (CONDITIONS.includes(req.query.condition)) filter.condition = req.query.condition;
    const q = text(req.query.q).slice(0, 60);
    if (q) {
      const rx = { $regex: escapeRegex(q), $options: 'i' };
      filter.$or = [{ title: rx }, { description: rx }, { location: rx }];
    }
    const listings = await Listing.find(filter).sort({ createdAt: -1 }).limit(60).populate('seller', SELLER_FIELDS).lean();
    res.json(listings.filter((l) => l.seller)); // skip listings of deleted accounts
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getListing = async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(404).json({ message: 'Listing not found' });
    const listing = await Listing.findById(req.params.id).populate('seller', SELLER_FIELDS).lean();
    if (!listing?.seller) return res.status(404).json({ message: 'Listing not found' });
    res.json(listing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createListing = async (req, res) => {
  try {
    const value = {
      title: text(req.body.title),
      description: text(req.body.description),
      condition: req.body.condition,
      location: text(req.body.location),
    };
    const files = req.files || [];
    if (!value.title || value.title.length > 80) return res.status(400).json({ message: 'Add a title (up to 80 characters)' });
    if (value.description.length > 1000) return res.status(400).json({ message: 'Keep the description under 1000 characters' });
    if (!CONDITIONS.includes(value.condition)) return res.status(400).json({ message: 'Pick the condition' });
    if (!value.location || value.location.length > 80) return res.status(400).json({ message: 'Add where the item is (up to 80 characters)' });
    if (files.length < 1 || files.length > MAX_PHOTOS) return res.status(400).json({ message: `Add 1 to ${MAX_PHOTOS} photos` });

    // Everything checked first, so a bad request doesn't leave photos on ImageKit
    const uploads = await Promise.all(files.map((file, i) => imagekit.upload({
      file: file.buffer.toString('base64'),
      fileName: `listing_${req.user._id}_${Date.now()}_${i}`,
      folder: '/arenax_listings',
    })));
    const listing = await Listing.create({ ...value, seller: req.user._id, photos: uploads.map((u) => u.url) });
    res.status(201).json(await Listing.findById(listing._id).populate('seller', SELLER_FIELDS).lean());
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
    res.status(500).json({ message: error.message });
  }
};

// The listing, if the logged-in user may change it (its seller or an admin)
const ownListing = async (req, res) => {
  if (!isId(req.params.id)) { res.status(404).json({ message: 'Listing not found' }); return null; }
  const listing = await Listing.findById(req.params.id);
  if (!listing) { res.status(404).json({ message: 'Listing not found' }); return null; }
  if (!listing.seller.equals(req.user._id) && req.user.role !== 'admin') {
    res.status(403).json({ message: 'Only the seller can change this listing' });
    return null;
  }
  return listing;
};

const updateListing = async (req, res) => {
  try {
    const listing = await ownListing(req, res);
    if (!listing) return;
    if (!['active', 'sold'].includes(req.body.status)) return res.status(400).json({ message: 'Status must be active or sold' });
    listing.status = req.body.status;
    await listing.save();
    res.json(await Listing.findById(listing._id).populate('seller', SELLER_FIELDS).lean());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteListing = async (req, res) => {
  try {
    const listing = await ownListing(req, res);
    if (!listing) return;
    await listing.deleteOne();
    res.json({ message: 'Listing deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { listListings, getListing, createListing, updateListing, deleteListing, MAX_PHOTOS };
