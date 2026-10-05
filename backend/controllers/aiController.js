const getAIResponse = require('../services/aiService');
const Flight = require('../models/Flight');
const Booking = require('../models/Booking');
const Chat = require('../models/Chat');
const generatePNR = require('../utils/generatePNR');
const { getAvailableSeats, isSeatAvailable } = require('../utils/seatHelper');

exports.chat = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    let chat = await Chat.findOne({ userId });
    if (!chat) {
      chat = await Chat.create({ userId, messages: [] });
    }

    const historyForAI = chat.messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const aiResult = await getAIResponse(message, historyForAI);
    console.log('AI RESULT:', JSON.stringify(aiResult, null, 2));

    let data = null;

    switch (aiResult.intent) {
      case 'SEARCH_FLIGHT': {
        const filter = {};
        if (aiResult.source) filter.source = aiResult.source;
        if (aiResult.destination) filter.destination = aiResult.destination;
        if (aiResult.date) filter.date = aiResult.date;
        if (aiResult.maxPrice) filter.price = { $lte: Number(aiResult.maxPrice) };
        if (aiResult.stops !== null && aiResult.stops !== undefined) filter.stops = Number(aiResult.stops);

        data = await Flight.find(filter).sort({ price: 1 });
        break;
      }

      case 'BOOK_FLIGHT': {
        if (!aiResult.flightId) {
          aiResult.reply = 'Please tell me which flight you want to book.';
          break;
        }

        const flight = await Flight.findById(aiResult.flightId);
        if (!flight || flight.availableSeats <= 0) {
          aiResult.reply = 'Sorry, that flight is not available.';
          break;
        }

        const booking = await Booking.create({
          userId,
          flightId: flight._id,
          passenger: { name: 'Passenger', age: 25, gender: 'other' },
          seat: aiResult.seat || '1A',
          class: 'economy',
          totalPrice: flight.price,
          status: 'CONFIRMED',
          pnr: generatePNR(),
        });

        flight.availableSeats -= 1;
        await flight.save();

        data = booking;
        aiResult.reply = `Booking confirmed! Your PNR is ${booking.pnr}.`;
        break;
      }

      case 'CHECK_BOOKING': {
        data = await Booking.find({ userId }).populate('flightId').sort({ createdAt: -1 });
        break;
      }

      case 'CANCEL_BOOKING': {
        if (!aiResult.bookingId) {
          aiResult.reply = 'Please tell me which booking you want to cancel.';
          break;
        }

        const booking = await Booking.findById(aiResult.bookingId);
        if (!booking || booking.userId.toString() !== userId) {
          aiResult.reply = 'I could not find that booking.';
          break;
        }

        booking.status = 'CANCELLED';
        await booking.save();

        const flight = await Flight.findById(booking.flightId);
        if (flight) {
          flight.availableSeats += 1;
          await flight.save();
        }

        data = booking;
        aiResult.reply = 'Your booking has been cancelled.';
        break;
      }

      case 'CHANGE_SEAT': {
        // Find which booking to modify — use bookingId if given, else the user's most recent CONFIRMED booking
        let booking;
        if (aiResult.bookingId) {
          booking = await Booking.findById(aiResult.bookingId);
        } else {
          booking = await Booking.findOne({ userId, status: 'CONFIRMED' }).sort({ createdAt: -1 });
        }

        if (!booking || booking.userId.toString() !== userId) {
          aiResult.reply = 'I could not find a booking to update. Please specify your booking ID.';
          break;
        }

        if (booking.status !== 'CONFIRMED') {
          aiResult.reply = 'This booking is not active, so the seat cannot be changed.';
          break;
        }

        if (!aiResult.seat) {
          const availableSeats = await getAvailableSeats(booking.flightId);
          aiResult.reply = `Please tell me which seat you'd like. Available seats: ${availableSeats.slice(0, 10).join(', ')}${availableSeats.length > 10 ? '...' : ''}`;
          break;
        }

        const requestedSeat = aiResult.seat.toUpperCase();
        const seatFree = await isSeatAvailable(booking.flightId, requestedSeat);

        if (!seatFree) {
          const availableSeats = await getAvailableSeats(booking.flightId);
          aiResult.reply = `Sorry, seat ${requestedSeat} is already taken. Available seats: ${availableSeats.slice(0, 10).join(', ')}${availableSeats.length > 10 ? '...' : ''}`;
          break;
        }

        booking.seat = requestedSeat;
        await booking.save();

        data = booking;
        aiResult.reply = `Your seat has been changed to ${requestedSeat}.`;
        break;
      }

      default:
        break;
    }

    chat.messages.push({ role: 'user', content: message });
    chat.messages.push({
      role: 'assistant',
      content: aiResult.reply,
      intent: aiResult.intent,
      data,
    });
    await chat.save();

    res.status(200).json({
      intent: aiResult.intent,
      reply: aiResult.reply,
      data,
    });
  } catch (error) {
    console.error('AI CHAT ERROR:', error);
    const isQuotaError = error.status === 429;
    const userMessage = isQuotaError
      ? 'The AI assistant is temporarily busy. Please wait a moment and try again.'
      : 'AI chat error';
    res.status(500).json({ message: userMessage, error: error.message });
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const chat = await Chat.findOne({ userId: req.user.id });
    res.status(200).json({ messages: chat ? chat.messages : [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.clearChat = async (req, res) => {
  try {
    await Chat.findOneAndUpdate(
      { userId: req.user.id },
      { messages: [] },
      { upsert: true }
    );
    res.status(200).json({ message: 'Chat cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};