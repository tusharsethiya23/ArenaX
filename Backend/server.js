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

// Origins allowed to call this API (used for both Express and Socket.io).
// Add your deployed Vercel URL here once the frontend is live.
const allowedOrigins = [
  'http://localhost:5173',
  // 'https://your-frontend.vercel.app',
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow tools like Postman (no origin) and anything in the allowed list
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected ✅'))
  .catch((err) => console.log('MongoDB error ❌', err));

// ---------- Routes ----------
// Each path below must match the real file name in your routes/ folder
app.use('/api/auth', require('./routes/authRoutes.js'));
app.use('/api/users', require('./routes/userRoutes.js'));
app.use('/api/bookings', require('./routes/bookingRoutes.js'));
app.use('/api/messages', require('./routes/messageRoutes.js'));
app.use('/api/reviews', require('./routes/reviewRoutes.js'));
app.use('/api/endorsements', require('./routes/endorsement.js'));
app.use('/api/achievements', require('./routes/achievementRoutes.js'));
app.use('/api/content', require('./routes/contentRoutes.js'));
app.use('/api/brands', require('./routes/brandRoutes.js'));
app.use('/api/deals', require('./routes/dealRoutes.js'));
app.use('/api/subscriptions', require('./routes/subscriptionRoutes.js'));
app.use('/api/spotlight', require('./routes/spotLightRoutes.js'));
app.use('/api/analytics', require('./routes/analyticRoutes.js'));
app.use('/api/tournaments', tournamentRoutes);

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