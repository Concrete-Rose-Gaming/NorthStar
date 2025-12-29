import { useEffect, useRef, useState } from 'react';
import { socketService } from '../services/socketService';
import { useGameStore } from '../store/gameStore';
import './Chat.css';

interface ChatProps {
  username: string;
  roomId?: string;
}

function Chat({ username, roomId }: ChatProps) {
  const { chatMessages } = useGameStore();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socketService.requestChatHistory(roomId);
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      socketService.sendChatMessage(message, username, roomId);
      setMessage('');
    }
  };

  const relevantMessages = roomId
    ? chatMessages.filter(m => m.roomId === roomId)
    : chatMessages.filter(m => !m.roomId);

  return (
    <div className="chat">
      <h2>Chat</h2>
      <div className="chat-messages">
        {relevantMessages.map(msg => (
          <div key={msg.id} className="chat-message">
            <span className="chat-username">{msg.username}:</span>
            <span className="chat-text">{msg.message}</span>
            <span className="chat-time">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="chat-input-form">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="chat-input"
        />
        <button type="submit" className="chat-send-button">Send</button>
      </form>
    </div>
  );
}

export default Chat;

