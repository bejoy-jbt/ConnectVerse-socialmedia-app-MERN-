import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // For navigation links
import './ChatRoom.css'; 

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <ul className="navbar-links">
          <li className="navbar-item">
            <Link to="/home" className="navbar-link">Home</Link>
          </li>
          
          <li className="navbar-item">
            <Link to="/profile" className="navbar-link">Profile</Link>
          </li>
          <li className="navbar-item">
            <Link to="/search" className="navbar-link">Search</Link>
          </li>
          <li className="navbar-item">
            <Link to="/sample" className="navbar-link">Upload</Link>
          </li>
          <li className="navbar-item">
            <Link to="/domain" className="navbar-link">Domain</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

const ChatRoom = () => {
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState('');
  const [message, setMessage] = useState('');

  // Fetch all messages from the server
  const fetchMessages = async () => {
    try {
      const response = await fetch('http://localhost:3001/messages'); // Use port 3001 for backend
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      } else {
        console.error('Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Send a new message to the server
  const sendMessage = async () => {
    if (!user.trim() || !message.trim()) {
      alert('Both user name and message are required!');
      return;
    }

    try {
      await fetch('http://localhost:3001/messages', { // Use port 3001 for backend
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user, message }),
      });
      setMessage(''); // Clear the message input
      fetchMessages(); // Update the messages list
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  useEffect(() => {
    fetchMessages(); // Fetch messages when the component mounts

    // Poll messages every 2 seconds
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval); // Cleanup on component unmount
  }, []);

  return (
    <div>
      <Navbar />
      <div className="chat-container">
        <h2 className="chat-title">Chat Room</h2>
        <ul className="message-list">
          {messages.slice(0).reverse().map(({ _id, user, message }) => ( // Reverse the order of messages
            <li key={_id} className="chat-message">
              <strong>{user}:</strong> {message}
            </li>
          ))}
        </ul>
        <div className="input-container" >
          <input
            type="text"
            placeholder="Your name"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            className="user-input"
          />
          <input
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="message-input"
          />
          <button onClick={sendMessage} className="send-button">Send</button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
