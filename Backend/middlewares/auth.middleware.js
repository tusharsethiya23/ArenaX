const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Brand = require('../models/brand.model');

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

// Like `protect`, but lets the request through without a token (or with a bad
// one) as an anonymous visitor. Used by public endpoints that show extra
// details, such as "did I like this?", when someone is logged in.
const optionalProtect = async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer')) return next();
    try {
        const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
        if (decoded.type === 'brand') {
            req.brand = await Brand.findById(decoded.id).select('-password');
            req.userType = 'brand';
        } else {
            req.user = await User.findById(decoded.id).select('-password');
            req.userType = 'user';
        }
    } catch {
        // Invalid/expired token: carry on as anonymous
    }
    next();
};

module.exports = { protect, optionalProtect };