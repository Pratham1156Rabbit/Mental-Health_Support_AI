import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import './PublicChat.css';

export default function PublicChat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hello! I'm Rabbit 🐰 — you can chat with me without logging in.\n\n**Guest mode:** nothing you type is saved. If you want chat history + mood tracker + journal, please **sign up / log in**."
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const history = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .slice(-20);

      const response = await axios.post('/api/public-chat', {
        message: userMessage,
        history
      });

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response.data.response || response.data.fallback || "Sorry — I couldn't respond right now."
        }
      ]);
    } catch (error) {
      console.error('Public chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content:
            "I'm having trouble connecting right now. Please try again in a moment.\n\nIf you want saved history and tools, you can log in anytime."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="public-chat-wrap">
      <div className="public-chat-header">
        <div>
          <h1 className="public-chat-title">Rabbit 🐰 (Guest Chat)</h1>
          <p className="public-chat-subtitle">
            Nothing is saved unless you <Link to="/register">sign up</Link> or <Link to="/login">log in</Link>.
          </p>
        </div>
        <div className="public-chat-actions">
          <Link className="public-chat-link" to="/mental-health">Mental Health Info</Link>
          <Link className="public-chat-link strong" to="/login">Log in</Link>
        </div>
      </div>

      <div className="public-chat-card">
        <div className="public-chat-messages" aria-live="polite">
          {messages.map((msg, idx) => (
            <div key={idx} className={`public-message ${msg.role}`}>
              <div className="public-message-content">
                {msg.role === 'assistant' ? <ReactMarkdown>{msg.content}</ReactMarkdown> : msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="public-message assistant">
              <div className="public-message-content">
                <div className="public-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="public-chat-input" onSubmit={handleSend}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}


