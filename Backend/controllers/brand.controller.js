const Brand = require('../models/brand.model');
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readinessForAthletes } = require('./dna.controller');

// Athlete DNA readiness % at which athletes show up in brand talent search
const BRAND_READY = 70;

const registerBrand = async (req, res) => {
  try {
    const { companyName, email, password, industry, website } = req.body;

    const existing = await Brand.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Brand already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const brand = await Brand.create({
      companyName,
      email,
      password: hashedPassword,
      industry,
      website,
    });

    const token = jwt.sign({ id: brand._id, type: 'brand' }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    res.status(201).json({ _id: brand._id, companyName: brand.companyName, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginBrand = async (req, res) => {
  try {
    const { email, password } = req.body;
    const brand = await Brand.findOne({ email });

    if (!brand || !(await bcrypt.compare(password, brand.password))) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: brand._id, type: 'brand' }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    res.json({ _id: brand._id, companyName: brand.companyName, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Talent search — sport, region, min stats se
const searchTalent = async (req, res) => {
  try {
    const { sport, location } = req.query;
    let filter = { role: 'coach' };
    if (sport) filter.sport = sport;
    if (location) filter.location = location;

    const coaches = await User.find(filter).select('-password').lean();

    // Athletes become discoverable to brands once their Athlete DNA readiness
    // reaches BRAND_READY (public accounts only)
    const athletes = await User.find({ ...filter, role: 'learner', isPrivate: { $ne: true } }).select('-password').lean();
    const readiness = await readinessForAthletes(athletes);
    const brandReady = athletes
      .filter((a) => readiness[String(a._id)] >= BRAND_READY)
      .map((a) => ({ ...a, readiness: readiness[String(a._id)] }))
      .sort((a, b) => b.readiness - a.readiness);

    res.json([...coaches, ...brandReady]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerBrand, loginBrand, searchTalent };