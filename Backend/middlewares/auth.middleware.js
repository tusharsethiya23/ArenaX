const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Brand = require('../models/brand.model');
const userCache = require('../utils/userCache.util');

// The logged-in user as a Mongoose document (so handlers can still .save()
// it), from the short-lived cache when possible: saves a database round
// trip on most requests. null if the account no longer exists.
const loadUser = async (id) => {
    let plain = userCache.get(id);
    if (!plain) {
        plain = await User.findById(id).select('-password').lean();
        if (!plain) return null;
        userCache.set(id, plain);
    }
    return User.hydrate(plain);
};

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
            req.user = await loadUser(decoded.id);
            req.userType = 'user';
        }
    } catch {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }

    // A valid token for an account that has since been deleted
    if (!req.user && !req.brand) {
        return res.status(401).json({ message: 'This account no longer exists. Please log in again.' });
    }
    // Accounts that haven't proven their email (older logins included) must log
    // in again, which asks for the emailed code
    if (req.user && req.user.emailVerified !== true) {
        return res.status(401).json({ code: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email. Log in again to get a code.' });
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
            req.user = await loadUser(decoded.id);
            req.userType = 'user';
        }
    } catch {
        // Invalid/expired token: carry on as anonymous
    }
    // Deleted or unverified account: also anonymous
    if (req.user && req.user.emailVerified !== true) req.user = null;
    if (!req.user) delete req.user;
    if (!req.brand) delete req.brand;
    if (!req.user && !req.brand) delete req.userType;
    next();
};

module.exports = { protect, optionalProtect };