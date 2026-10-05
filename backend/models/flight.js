const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
  airline: { type: String, required: true },
  flightNumber: { type: String, required: true },
  source: { type: String, required: true },
  destination: { type: String, required: true },
  date: { type: String, required: true }, // e.g. "2026-08-20"
  departureTime: { type: String, required: true }, // e.g. "07:30"
  arrivalTime: { type: String, required: true },
  duration: { type: Number, required: true }, // in minutes
  price: { type: Number, required: true },
  stops: { type: Number, default: 0 },
  availableSeats: { type: Number, required: true },
  class: { type: [String], default: ['economy'] }, // array e.g. ['economy','business']
}, { timestamps: true });

module.exports = mongoose.model('Flight', flightSchema);