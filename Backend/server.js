// server.js
// Entry point: sets up Express, connects MongoDB, mounts the API routes,
// and attaches Socket.io (for real-time chat) to the same HTTP server.

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const tournamentRoutes = require('./routes/tournament.routes.js');

// Websites allowed to call this API from a browser (used for both Express and
// Socket.io): local dev, the live Render frontend, and any extra addresses in
// CLIENT_URLS (comma-separated, e.g. a custom domain) without a code change.
const allowedOrigins = [
  'http://localhost:5173',
  'https://arenax-frontend.onrender.com', // live site (Render Static Site)
  'https://arenax-4yzn.onrender.com', // old site, until it's deleted
  ...(process.env.CLIENT_URLS || '').split(',').map((url) => url.trim().replace(/\/$/, '')).filter(Boolean),
];

app.use(cors({
  // Tools like Postman send no origin and are allowed. Other websites get no
  // CORS headers, so their browser blocks the response (instead of a 500).
  origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)),
  // Browsers may reuse the answer to their "may I call this API?" check
  // (preflight) for 2 hours instead of asking before every request
  maxAge: 2 * 60 * 60,
}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected ✅'))
  .catch((err) => console.log('MongoDB error ❌', err));

// ---------- Routes ----------
// Each path below must match the real file name in your routes/ folder
app.use('/api/auth', require('./routes/auth.routes.js'));
app.use('/api/users', require('./routes/user.routes.js'));
app.use('/api/bookings', require('./routes/booking.routes.js'));
app.use('/api/messages', require('./routes/message.routes.js'));
app.use('/api/reviews', require('./routes/review.routes.js'));
app.use('/api/endorsements', require('./routes/endorsement.routes.js'));
app.use('/api/achievements', require('./routes/achievement.routes.js'));
app.use('/api/content', require('./routes/content.routes.js'));
app.use('/api/brands', require('./routes/brand.routes.js'));
app.use('/api/deals', require('./routes/deal.routes.js'));
app.use('/api/subscriptions', require('./routes/subscription.routes.js'));
app.use('/api/spotlight', require('./routes/spotlight.routes.js'));
app.use('/api/analytics', require('./routes/analytics.routes.js'));
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/posts', require('./routes/post.routes.js'));
app.use('/api/follows', require('./routes/follow.routes.js'));
app.use('/api/dna', require('./routes/dna.routes.js'));
app.use('/api/ai', require('./routes/ai.routes.js'));
app.use('/api/match', require('./routes/match.routes.js'));

// Cheap "is the server up?" check (no database), e.g. for an uptime monitor
// that pings it every few minutes so the free Render instance doesn't sleep
app.get('/api/health', (req, res) => {
  res.set('Cache-Control', 'no-store').json({ ok: true });
});

app.get('/', (req, res) => {
  res.send('Sports Mentor Platform API is running 🎉');
});

// ---------- Socket.io (real-time chat) ----------
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
  // Each booking has its own room, so only its two participants get messages
  socket.on('joinBookingRoom', (bookingId) => socket.join(bookingId));

  socket.on('sendMessage', (messageData) => {
    socket.to(messageData.bookingId).emit('receiveMessage', messageData);
  });
});

const PORT = process.env.PORT || 5000;
// Listen on `server` (not `app`) so Socket.io and Express share one port
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));