const Brand = require('../models/Brand');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

    const talent = await User.find(filter).select('-password');
    res.json(talent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerBrand, loginBrand, searchTalent };