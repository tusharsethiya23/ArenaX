// Must be used AFTER the `protect` middleware, since it relies on req.user
// being already set. Blocks the request unless the logged-in user's role is 'admin'.
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access only' });
  }
};

module.exports = { adminOnly };