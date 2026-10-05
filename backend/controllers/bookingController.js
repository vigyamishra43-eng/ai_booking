const Booking = require('../models/Booking');
const Flight = require('../models/Flight');
const generatePNR = require('../utils/generatePNR');

// POST /api/bookings — create a new booking
exports.createBooking = async (req, res) => {
  try {
    const { flightId, passenger, seat, class: bookingClass } = req.body;
    const userId = req.user.id; // comes from auth middleware

    if (!flightId || !passenger || !seat || !bookingClass) {
      return res.status(400).json({ message: 'Missing required booking fields' });
    }

    // 1. Check flight exists
    const flight = await Flight.findById(flightId);
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    // 2. Check flight has available seats at all
    if (flight.availableSeats <= 0) {
      return res.status(400).json({ message: 'No seats available on this flight' });
    }

    // 3. Check this specific seat isn't already booked (only CONFIRMED bookings count)
    const existingSeatBooking = await Booking.findOne({
      flightId,
      seat,
      status: 'CONFIRMED',
    });
    if (existingSeatBooking) {
      return res.status(400).json({ message: `Seat ${seat} is already booked` });
    }

    // 4. Backend calculates price — never trust price from frontend
    const totalPrice = flight.price;

    // 5. Generate a unique PNR
    const pnr = generatePNR();

    // 6. Create the booking
    const booking = await Booking.create({
      userId,
      flightId,
      passenger,
      seat,
      class: bookingClass,
      totalPrice,
      status: 'CONFIRMED',
      pnr,
    });

    // 7. Reduce available seats on the flight
    flight.availableSeats -= 1;
    await flight.save();

    res.status(201).json({ booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/bookings — get logged-in user's bookings
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate('flightId')
      .sort({ createdAt: -1 });

    res.status(200).json({ count: bookings.length, bookings });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/bookings/:id — get one booking's details
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('flightId');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Ownership check — user can only view their own booking
    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }

    res.status(200).json({ booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE /api/bookings/:id — cancel a booking
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Ownership check
    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    // Prevent cancelling an already-cancelled booking
    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    booking.status = 'CANCELLED';
    await booking.save();

    // Give the seat back
    const flight = await Flight.findById(booking.flightId);
    if (flight) {
      flight.availableSeats += 1;
      await flight.save();
    }

    res.status(200).json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};