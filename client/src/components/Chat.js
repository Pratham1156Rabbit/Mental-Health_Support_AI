import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './Chat.css';

const Chat = () => {
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chats, setChats] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, chatId: null, title: '' });
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm Rabbit 🐰, and I'm here to help make you happy and treat your mental health! How are you feeling today? I'd love to chat and bring some positivity to your day! 😊"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);

  // Load chat list on mount
  useEffect(() => {
    loadChatList();
  }, []);

  // Load messages when chat changes
  useEffect(() => {
    if (currentChatId) {
      loadChatMessages(currentChatId);
    } else {
      setMessages([
        {
          role: 'assistant',
          content: "Hello! I'm here to support you. How are you feeling today? You can talk to me about anything that's on your mind."
        }
      ]);
    }
  }, [currentChatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatList = async () => {
    try {
      const response = await axios.get('/api/chats');
      setChats(response.data.chats || []);
    } catch (error) {
      console.error('Error loading chat list:', error);
    }
  };

  const loadChatMessages = async (chatId) => {
    try {
      const response = await axios.get(`/api/chat/${chatId}`);
      const loadedMessages = response.data.messages || [];
      
      if (loadedMessages.length > 0) {
        setMessages(loadedMessages.map(m => ({
          role: m.role,
          content: m.content
        })));
      } else {
        setMessages([
          {
            role: 'assistant',
            content: "Hello! I'm Rabbit 🐰, and I'm here to help make you happy and treat your mental health! How are you feeling today? I'd love to chat and bring some positivity to your day! 😊"
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([
      {
        role: 'assistant',
        content: "Hello! I'm Rabbit 🐰, and I'm here to help make you happy and treat your mental health! How are you feeling today? I'd love to chat and bring some positivity to your day! 😊"
      }
    ]);
    setInput('');
  };

  const handleSelectChat = (chatId) => {
    setCurrentChatId(chatId);
    setSidebarOpen(false);
  };

  const requestDeleteChat = (chat, e) => {
    e?.stopPropagation?.();
    setDeleteConfirm({ open: true, chatId: chat.chatId, title: chat.title || 'this chat' });
  };

  const cancelDelete = () => setDeleteConfirm({ open: false, chatId: null, title: '' });

  const confirmDelete = async () => {
    const chatIdToDelete = deleteConfirm.chatId;
    if (!chatIdToDelete) return cancelDelete();

    try {
      await axios.post(`/api/chats/${chatIdToDelete}/delete`);

      // Remove from UI list
      setChats(prev => prev.filter(c => c.chatId !== chatIdToDelete));

      // If deleting current chat, reset to new chat
      if (currentChatId === chatIdToDelete) {
        handleNewChat();
      }
    } catch (error) {
      console.error('Delete chat error:', error);
    } finally {
      cancelDelete();
      loadChatList();
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await axios.post('/api/chat', {
        message: userMessage,
        chatId: currentChatId
      });

      const newChatId = response.data.chatId;
      
      // Update current chat ID if it's a new chat
      if (!currentChatId && newChatId) {
        setCurrentChatId(newChatId);
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.data.response || response.data.fallback 
      }]);

      // Reload chat list to update
      loadChatList();
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment, or check the Resources page for immediate support options." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const formatChatTitle = (title) => {
    if (title.length > 30) {
      return title.substring(0, 30) + '...';
    }
    return title;
  };

  return (
    <div className="chat-container-wrapper">
      {/* Sidebar */}
      <div className={`chat-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Chats</h2>
          <button className="new-chat-button" onClick={handleNewChat}>
            + New Chat
          </button>
        </div>
        <div className="chat-list">
          {chats.map((chat) => (
            <div
              key={chat.chatId}
              className={`chat-item ${currentChatId === chat.chatId ? 'active' : ''}`}
              onClick={() => handleSelectChat(chat.chatId)}
            >
              <div className="chat-item-row">
                <div className="chat-item-title">{formatChatTitle(chat.title)}</div>
                <button
                  type="button"
                  className="chat-delete-btn"
                  title="Delete chat"
                  onClick={(e) => requestDeleteChat(chat, e)}
                >
                  🗑️
                </button>
              </div>
              <div className="chat-item-meta">
                {new Date(chat.lastMessage).toLocaleDateString()}
              </div>
            </div>
          ))}
          {chats.length === 0 && (
            <div className="no-chats">No previous chats. Start a new conversation!</div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-container">
        <div className="chat-header">
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <div>
            <h1>Rabbit 🐰</h1>
            <h2>Happy here to Help you and make you happy and treat your mental health</h2>
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <div className="message-content">
                {msg.role === 'assistant' ? (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="message assistant">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-form" onSubmit={handleSend}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
            className="chat-input"
            disabled={loading}
          />
          <button 
            type="submit" 
            className="send-button"
            disabled={loading || !input.trim()}
          >
            Send
          </button>
        </form>
      </div>

      {deleteConfirm.open && (
        <div className="modal-backdrop" onClick={cancelDelete}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Do you really want to delete this chat?</h3>
            <p className="modal-sub">
              <strong>{deleteConfirm.title}</strong>
            </p>
            <div className="modal-actions">
              <button type="button" className="modal-btn danger" onClick={confirmDelete}>
                YES
              </button>
              <button type="button" className="modal-btn" onClick={cancelDelete}>
                NO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
