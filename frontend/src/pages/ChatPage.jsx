import { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [seatPicker, setSeatPicker] = useState(null); // { flight, availableSeats } or null
  const { user, logout } = useAuth();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, seatPicker]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await api.get('/ai/history');
        if (res.data.messages && res.data.messages.length > 0) {
          setMessages(res.data.messages);
        } else {
          setMessages([
            { role: 'assistant', content: 'Hi! I can help you search, book, and manage flights. Try asking me something like "Show me flights from Delhi to Mumbai".' },
          ]);
        }
      } catch (error) {
        setMessages([
          { role: 'assistant', content: 'Hi! I can help you search, book, and manage flights.' },
        ]);
      }
    };
    loadHistory();
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: userMessage.content,
      });

      const aiMessage = {
        role: 'assistant',
        content: res.data.reply,
        data: res.data.data,
        intent: res.data.intent,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: user clicks "Book this flight" — fetch available seats and show picker
  const handleShowSeats = async (flight) => {
    setLoading(true);
    try {
      const res = await api.get(`/flights/${flight._id}/seats`);
      setSeatPicker({ flight, availableSeats: res.data.availableSeats });
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Could not load seat availability. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: user picks a specific seat — actually create the booking
  const handleConfirmSeat = async (seat) => {
    const flight = seatPicker.flight;
    setSeatPicker(null);
    setLoading(true);
    try {
      const res = await api.post('/bookings', {
        flightId: flight._id,
        passenger: { name: user?.name || 'Passenger', age: 25, gender: 'other' },
        seat,
        class: 'economy',
      });

      const confirmMessage = {
        role: 'assistant',
        content: `Booking confirmed! Your PNR is ${res.data.booking.pnr}.`,
        data: res.data.booking,
        intent: 'BOOK_FLIGHT',
      };
      setMessages((prev) => [...prev, confirmMessage]);
    } catch (error) {
      const errMessage = {
        role: 'assistant',
        content: error.response?.data?.message || 'Booking failed. Please try again.',
      };
      setMessages((prev) => [...prev, errMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = async () => {
    try {
      await api.delete('/ai/history');
      setMessages([
        { role: 'assistant', content: 'Hi! I can help you search, book, and manage flights. Try asking me something like "Show me flights from Delhi to Mumbai".' },
      ]);
    } catch (error) {
      console.error('Failed to clear chat:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="chat-page">
      <header className="chat-header">
        <h2>✈️ AI Flight Assistant</h2>
        <div>
          <span>Hi, {user?.name}</span>
          <button onClick={handleNewChat} className="new-chat-btn">New Chat</button>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <p>{msg.content}</p>

            {msg.intent === 'SEARCH_FLIGHT' && Array.isArray(msg.data) && msg.data.length === 0 && (
              <p className="no-results">No flights found for that route.</p>
            )}

            {msg.data && Array.isArray(msg.data) && msg.data.length > 0 && (
              <div className="flight-cards">
                {msg.data.map((flight) => (
                  <div key={flight._id} className="flight-card">
                    <div className="flight-card-header">
                      <strong>{flight.airline}</strong> · {flight.flightNumber}
                    </div>
                    <div className="flight-card-body">
                      <span>{flight.source} → {flight.destination}</span>
                      <span>{flight.departureTime} - {flight.arrivalTime}</span>
                      <span>₹{flight.price}</span>
                      <span>{flight.availableSeats} seats left</span>
                    </div>
                    <button
                      className="book-btn"
                      onClick={() => handleShowSeats(flight)}
                      disabled={flight.availableSeats <= 0}
                    >
                      Book this flight
                    </button>
                  </div>
                ))}
              </div>
            )}

            {msg.data && !Array.isArray(msg.data) && msg.intent === 'BOOK_FLIGHT' && (
              <div className="booking-card">
                <p>PNR: <strong>{msg.data.pnr}</strong></p>
                <p>Seat: {msg.data.seat}</p>
                <p>Total: ₹{msg.data.totalPrice}</p>
              </div>
            )}
          </div>
        ))}

        {/* Seat picker appears as its own message-like block when active */}
        {seatPicker && (
          <div className="message assistant">
            <p>
              Choose a seat for {seatPicker.flight.airline} {seatPicker.flight.flightNumber}:
            </p>
            <div className="seat-grid">
              {seatPicker.availableSeats.map((seat) => (
                <button
                  key={seat}
                  className="seat-btn"
                  onClick={() => handleConfirmSeat(seat)}
                >
                  {seat}
                </button>
              ))}
            </div>
            <button className="cancel-seat-btn" onClick={() => setSeatPicker(null)}>
              Cancel
            </button>
          </div>
        )}

        {loading && <div className="message assistant"><p>Typing...</p></div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading}>Send</button>
      </div>
    </div>
  );
};

export default ChatPage;