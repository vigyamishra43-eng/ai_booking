const Flight = require('../models/Flight');
const { getAvailableSeats } = require('../utils/seatHelper');

exports.getFlights = async (req, res) => {
  try {
    const { source, destination, date, maxPrice, stops, class: flightClass } = req.query;

    const filter = {};
    if (source) filter.source = source;
    if (destination) filter.destination = destination;
    if (date) filter.date = date;
    if (maxPrice) filter.price = { $lte: Number(maxPrice) };
    if (stops !== undefined) filter.stops = Number(stops);
    if (flightClass) filter.class = flightClass;

    const flights = await Flight.find(filter).sort({ price: 1 });

    res.status(200).json({ count: flights.length, flights });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getFlightById = async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }
    res.status(200).json({ flight });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getFlightSeats = async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }
    const availableSeats = await getAvailableSeats(req.params.id);
    res.status(200).json({ availableSeats });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createFlight = async (req, res) => {
  try {
    const flight = await Flight.create(req.body);
    res.status(201).json({ flight });
  } catch (error) {
    res.status(400).json({ message: 'Invalid flight data', error: error.message });
  }
};

exports.updateFlight = async (req, res) => {
  try {
    const flight = await Flight.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }
    res.status(200).json({ flight });
  } catch (error) {
    res.status(400).json({ message: 'Invalid update', error: error.message });
  }
};

exports.deleteFlight = async (req, res) => {
  try {
    const flight = await Flight.findByIdAndDelete(req.params.id);
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }
    res.status(200).json({ message: 'Flight deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};