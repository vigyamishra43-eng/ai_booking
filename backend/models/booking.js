const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  flightId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flight', required: true },
  passenger: {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
  },
  seat: { type: String, required: true },
  class: { type: String, required: true },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['CONFIRMED', 'CANCELLED', 'COMPLETED'], default: 'CONFIRMED' },
  pnr: { type: String, required: true, unique: true },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);