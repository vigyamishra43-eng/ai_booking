require('dotenv').config();
const mongoose = require('mongoose');
const Flight = require('../models/Flight');

const flights = [
  {
    airline: 'IndiGo', flightNumber: '6E123', source: 'Delhi', destination: 'Mumbai',
    date: '2026-08-20', departureTime: '07:30', arrivalTime: '09:45', duration: 135,
    price: 4200, stops: 0, availableSeats: 32, class: ['economy', 'business'],
  },
  {
    airline: 'Air India', flightNumber: 'AI101', source: 'Delhi', destination: 'Mumbai',
    date: '2026-08-20', departureTime: '10:00', arrivalTime: '12:30', duration: 150,
    price: 3800, stops: 0, availableSeats: 20, class: ['economy'],
  },
  {
    airline: 'SpiceJet', flightNumber: 'SG202', source: 'Mumbai', destination: 'Delhi',
    date: '2026-08-20', departureTime: '06:00', arrivalTime: '08:30', duration: 150,
    price: 4000, stops: 0, availableSeats: 25, class: ['economy'],
  },
  {
    airline: 'IndiGo', flightNumber: '6E456', source: 'Delhi', destination: 'Bangalore',
    date: '2026-08-20', departureTime: '08:15', arrivalTime: '11:00', duration: 165,
    price: 5200, stops: 0, availableSeats: 18, class: ['economy', 'business'],
  },
  {
    airline: 'Vistara', flightNumber: 'UK808', source: 'Bangalore', destination: 'Delhi',
    date: '2026-08-20', departureTime: '14:00', arrivalTime: '16:45', duration: 165,
    price: 5600, stops: 0, availableSeats: 15, class: ['economy', 'business'],
  },
  {
    airline: 'IndiGo', flightNumber: '6E789', source: 'Delhi', destination: 'Goa',
    date: '2026-08-20', departureTime: '09:00', arrivalTime: '11:30', duration: 150,
    price: 4800, stops: 0, availableSeats: 30, class: ['economy'],
  },
  {
    airline: 'Air India', flightNumber: 'AI202', source: 'Mumbai', destination: 'Bangalore',
    date: '2026-08-20', departureTime: '13:00', arrivalTime: '14:30', duration: 90,
    price: 3500, stops: 0, availableSeats: 22, class: ['economy'],
  },
  {
    airline: 'SpiceJet', flightNumber: 'SG303', source: 'Bangalore', destination: 'Mumbai',
    date: '2026-08-20', departureTime: '17:00', arrivalTime: '18:30', duration: 90,
    price: 3600, stops: 0, availableSeats: 28, class: ['economy'],
  },
  {
    airline: 'Vistara', flightNumber: 'UK909', source: 'Delhi', destination: 'Hyderabad',
    date: '2026-08-20', departureTime: '11:00', arrivalTime: '13:15', duration: 135,
    price: 4700, stops: 0, availableSeats: 20, class: ['economy', 'business'],
  },
  {
    airline: 'IndiGo', flightNumber: '6E111', source: 'Hyderabad', destination: 'Delhi',
    date: '2026-08-20', departureTime: '19:00', arrivalTime: '21:15', duration: 135,
    price: 4600, stops: 0, availableSeats: 24, class: ['economy'],
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    await Flight.deleteMany({}); // clear existing flights first
    console.log('Old flight data cleared');

    await Flight.insertMany(flights);
    console.log(`${flights.length} flights inserted successfully`);

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
};

seedDB();