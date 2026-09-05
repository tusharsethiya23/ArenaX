const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Brand = require('../models/Brand');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (decoded.type === 'brand') {
                req.brand = await Brand.findById(decoded.id).select('-password');
                req.userType = 'brand';
            } else {
                req.user = await User.findById(decoded.id).select('-password');
                req.userType = 'user';
            }

            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };