const Message = require('../models/Message');
const Booking = require('../models/Booking');

// Message bhejna
const sendMessage = async (req, res) => {
  try {
    const { bookingId, text } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check: ye booking confirmed hai?
    if (booking.status !== 'confirmed' && booking.status !== 'completed') {
      return res.status(403).json({ message: 'Messaging only allowed after booking is confirmed' });
    }

    // Check: sender in dono me se ek hai (learner ya coach)
    const senderId = req.user._id.toString();
    if (booking.learner.toString() !== senderId && booking.coach.toString() !== senderId) {
      return res.status(403).json({ message: 'Not authorized for this conversation' });
    }

    // Receiver decide karo — agar sender learner hai toh receiver coach hai, warna ulta
    const receiverId = booking.learner.toString() === senderId ? booking.coach : booking.learner;

    const message = await Message.create({
      booking: bookingId,
      sender: req.user._id,
      receiver: receiverId,
      text,
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Ek booking ki saari messages dekhna (chat history)
const getMessagesForBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const userId = req.user._id.toString();
    if (booking.learner.toString() !== userId && booking.coach.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized for this conversation' });
    }

    const messages = await Message.find({ booking: req.params.bookingId })
      .populate('sender', 'name')
      .sort({ createdAt: 1 }); // purani se nayi

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { sendMessage, getMessagesForBooking };