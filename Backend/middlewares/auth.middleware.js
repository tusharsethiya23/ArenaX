const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Brand = require('../models/brand.model');

const protect = async (req, res, next) => {
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type === 'brand') {
            req.brand = await Brand.findById(decoded.id).select('-password');
            req.userType = 'brand';
        } else {
            req.user = await User.findById(decoded.id).select('-password');
            req.userType = 'user';
        }
    } catch {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }

    // A valid token for an account that has since been deleted
    if (!req.user && !req.brand) {
        return res.status(401).json({ message: 'This account no longer exists. Please log in again.' });
    }
    next();
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
    // Deleted account: also anonymous (findById gave null)
    if (!req.user) delete req.user;
    if (!req.brand) delete req.brand;
    if (!req.user && !req.brand) delete req.userType;
    next();
};

module.exports = { protect, optionalProtect };