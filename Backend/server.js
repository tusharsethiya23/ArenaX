// server.js
// Entry point — sets up Express, connects MongoDB, and now also attaches
// Socket.io for real-time chat, sharing the same HTTP server.

const express = require('express');
const http = require('http'); // 👈 needed to attach Socket.io to the same server
const { Server } = require('socket.io'); // 👈 new
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app); // 👈 wrap Express app in a raw HTTP server

// Socket.io needs its own CORS config, separate from Express's cors()
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173'], // add deployed frontend URL later
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected ✅'))
  .catch((err) => console.log('MongoDB error ❌', err));

// ... existing route imports/mounts stay exactly as they are ...

// Socket.io connection handling — each connected browser tab gets a "socket"
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Join a "room" for a specific booking — only people in this booking's
  // conversation will receive messages sent to this room
  socket.on('joinBookingRoom', (bookingId) => {
    socket.join(bookingId);
  });

  // When a message is sent, broadcast it to everyone else in the same room
  socket.on('sendMessage', (messageData) => {
    socket.to(messageData.bookingId).emit('receiveMessage', messageData);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

app.get('/', (req, res) => {
  res.send('Sports Mentor Platform API is running 🎉');
});

const PORT = process.env.PORT || 5000;
// 👇 IMPORTANT: listen on `server`, not `app`, so Socket.io works too
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));