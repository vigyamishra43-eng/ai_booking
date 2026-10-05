const express = require('express');
const router = express.Router();
const {
  getFlights,
  getFlightById,
  getFlightSeats,
  createFlight,
  updateFlight,
  deleteFlight,
} = require('../controllers/flightController');
const protect = require('../middleware/authMiddleware');

router.get('/', getFlights);
router.get('/:id/seats', protect, getFlightSeats);
router.get('/:id', getFlightById);
router.post('/', protect, createFlight);
router.put('/:id', protect, updateFlight);
router.delete('/:id', protect, deleteFlight);

module.exports = router;