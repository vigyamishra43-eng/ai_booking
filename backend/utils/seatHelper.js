const Booking = require('../models/Booking');

// Generates a simple seat map: rows 1-8, columns A-D (32 seats total)
const generateAllSeats = () => {
  const seats = [];
  const columns = ['A', 'B', 'C', 'D'];
  for (let row = 1; row <= 8; row++) {
    columns.forEach((col) => seats.push(`${row}${col}`));
  }
  return seats;
};

// Returns which seats are already booked (CONFIRMED only) for a given flight
const getBookedSeats = async (flightId) => {
  const bookings = await Booking.find({ flightId, status: 'CONFIRMED' });
  return bookings.map((b) => b.seat);
};

// Returns available seats for a flight (all seats minus booked ones)
const getAvailableSeats = async (flightId) => {
  const allSeats = generateAllSeats();
  const bookedSeats = await getBookedSeats(flightId);
  return allSeats.filter((seat) => !bookedSeats.includes(seat));
};

// Checks if a specific seat is available on a flight
const isSeatAvailable = async (flightId, seat) => {
  const bookedSeats = await getBookedSeats(flightId);
  return !bookedSeats.includes(seat);
};

module.exports = { generateAllSeats, getBookedSeats, getAvailableSeats, isSeatAvailable };