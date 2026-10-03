const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// server.js
// CORS setup — allows requests from the local dev frontend.
// When the frontend is deployed later, add its live URL to this list too.
const allowedOrigins = [
  'http://localhost:5173', // local Vite dev server
];

app.use(cors({
  origin: function (origin, callback) {
    // Postman/no-origin requests allowed; otherwise must match the list
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

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const messageRoutes = require('./routes/messageRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const endorsementRoutes = require('./routes/endorsement');
const achievementRoutes = require('./routes/achievementRoutes');
const contentRoutes = require('./routes/contentRoutes');
const brandRoutes = require('./routes/brandRoutes');
const dealRoutes = require('./routes/dealRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const spotlightRoutes = require('./routes/spotLightRoutes');
const analyticsRoutes = require('./routes/analyticRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/endorsements', endorsementRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/spotlight', spotlightRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/', (req, res) => {
  res.send('ArenaX Platform API is running 🎉');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));