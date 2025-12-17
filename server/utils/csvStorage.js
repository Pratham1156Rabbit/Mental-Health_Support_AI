const fs = require('fs');
const path = require('path');

const STORAGE_DIR = path.join(__dirname, '../../User storage');

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// Ensure user directory exists
const ensureUserDir = (username) => {
  const userDir = path.join(STORAGE_DIR, username);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  return userDir;
};

// Read CSV file (simple parser - handles quoted fields)
const readCSV = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  
  if (lines.length <= 1) {
    return [];
  }

  const headers = parseCSVLine(lines[0]);
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const obj = {};
    headers.forEach((header, index) => {
      let value = values[index] || '';
      // Decode escaped characters
      value = value.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\"/g, '"');
      obj[header] = value;
    });
    data.push(obj);
  }

  return data;
};

// Simple CSV line parser (handles quoted fields)
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

// Write CSV file
const writeCSV = (filePath, data, headers) => {
  if (!data || data.length === 0) {
    // Create file with headers only
    const headerLine = headers.join(',');
    fs.writeFileSync(filePath, headerLine + '\n', 'utf-8');
    return;
  }

  const lines = [headers.join(',')];

  data.forEach(row => {
    const values = headers.map(header => {
      let value = row[header] || '';
      // Encode newlines and commas
      value = String(value).replace(/\n/g, '\\n').replace(/,/g, '\\,');
      // Quote if contains special characters
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    lines.push(values.join(','));
  });

  fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
};

// User storage functions
const getUserFilePath = (username, filename) => {
  const userDir = ensureUserDir(username);
  return path.join(userDir, filename);
};

// Users storage (global - all users in one file)
const USERS_FILE = path.join(STORAGE_DIR, 'users.csv');

const getUserByUsername = (username) => {
  const users = readCSV(USERS_FILE);
  return users.find(u => u.username === username);
};

const getUserByEmail = (email) => {
  const users = readCSV(USERS_FILE);
  return users.find(u => u.email === email.toLowerCase());
};

const createUser = (userData) => {
  const users = readCSV(USERS_FILE);
  
  // Check if username exists
  if (users.find(u => u.username === userData.username)) {
    throw new Error('Username already exists');
  }

  // Check if email exists
  if (users.find(u => u.email === userData.email.toLowerCase())) {
    throw new Error('Email already exists');
  }

  users.push(userData);
  const headers = ['username', 'email', 'password', 'name', 'emailVerified', 'createdAt'];
  writeCSV(USERS_FILE, users, headers);
  
  // Create user directory
  ensureUserDir(userData.username);
  
  return userData;
};

const updateUser = (username, updates) => {
  const users = readCSV(USERS_FILE);
  const index = users.findIndex(u => u.username === username);
  
  if (index === -1) {
    throw new Error('User not found');
  }

  users[index] = { ...users[index], ...updates };
  const headers = ['username', 'email', 'password', 'name', 'emailVerified', 'createdAt'];
  writeCSV(USERS_FILE, users, headers);
  
  return users[index];
};

// Conversation storage
const getConversations = (username, chatId = null) => {
  const filePath = getUserFilePath(username, 'conversations.csv');
  const allConversations = readCSV(filePath);
  
  // Handle legacy conversations without chatId (assign to default chat)
  const processedConversations = allConversations.map(c => {
    if (!c.chatId) {
      c.chatId = 'default_chat';
    }
    return c;
  });
  
  if (chatId) {
    return processedConversations.filter(c => c.chatId === chatId);
  }
  
  return processedConversations;
};

// Deleted chats storage (per user)
function getDeletedChats(username) {
  const filePath = getUserFilePath(username, 'deleted_chats.csv');
  return readCSV(filePath);
}

function isChatDeleted(username, chatId) {
  const deleted = getDeletedChats(username);
  return deleted.some(d => d.chatId === chatId);
}

function addDeletedChat(username, chatId) {
  const deleted = getDeletedChats(username);
  if (deleted.some(d => d.chatId === chatId)) return;
  deleted.push({ chatId, deletedAt: new Date().toISOString() });
  const headers = ['chatId', 'deletedAt'];
  writeCSV(getUserFilePath(username, 'deleted_chats.csv'), deleted, headers);
}

const getChatList = (username) => {
  const conversations = getConversations(username);
  const deletedSet = new Set(getDeletedChats(username).map(d => d.chatId));
  const chatIds = [...new Set(conversations.map(c => c.chatId || 'default_chat').filter(Boolean))];
  
  return chatIds.map(chatId => {
    if (deletedSet.has(chatId)) return null;
    const chatMessages = conversations.filter(c => (c.chatId || 'default_chat') === chatId);
    const firstUserMessage = chatMessages.find(m => m.role === 'user');
    return {
      chatId,
      title: firstUserMessage?.content?.substring(0, 50) || 'New Chat',
      lastMessage: chatMessages[chatMessages.length - 1]?.timestamp || '',
      messageCount: chatMessages.length
    };
  }).filter(Boolean).sort((a, b) => {
    if (!a.lastMessage) return 1;
    if (!b.lastMessage) return -1;
    return new Date(b.lastMessage) - new Date(a.lastMessage);
  });
};

const addConversation = (username, message) => {
  const conversations = getConversations(username);
  conversations.push(message);
  const headers = ['id', 'chatId', 'role', 'content', 'timestamp'];
  writeCSV(getUserFilePath(username, 'conversations.csv'), conversations, headers);
};

const updateConversations = (username, conversations) => {
  const headers = ['id', 'chatId', 'role', 'content', 'timestamp'];
  writeCSV(getUserFilePath(username, 'conversations.csv'), conversations, headers);
};

// Mood entries storage
const getMoodEntries = (username) => {
  const filePath = getUserFilePath(username, 'moods.csv');
  return readCSV(filePath);
};

const addMoodEntry = (username, entry) => {
  const entries = getMoodEntries(username);
  entries.push(entry);
  const headers = ['id', 'mood', 'note', 'timestamp'];
  writeCSV(getUserFilePath(username, 'moods.csv'), entries, headers);
};

// Journal entries storage
const getJournalEntries = (username) => {
  const filePath = getUserFilePath(username, 'journals.csv');
  return readCSV(filePath);
};

const addJournalEntry = (username, entry) => {
  const entries = getJournalEntries(username);
  entries.push(entry);
  const headers = ['id', 'content', 'timestamp'];
  writeCSV(getUserFilePath(username, 'journals.csv'), entries, headers);
};

// Email storage (all emails in one file)
const EMAILS_FILE = path.join(STORAGE_DIR, 'emails.csv');

const addEmail = (emailData) => {
  const emails = readCSV(EMAILS_FILE);
  emails.push(emailData);
  const headers = ['id', 'to', 'subject', 'type', 'otp', 'sentAt', 'username'];
  writeCSV(EMAILS_FILE, emails, headers);
};

const getEmails = () => {
  return readCSV(EMAILS_FILE);
};

module.exports = {
  getUserByUsername,
  getUserByEmail,
  createUser,
  updateUser,
  getConversations,
  getChatList,
  getDeletedChats,
  isChatDeleted,
  addDeletedChat,
  addConversation,
  updateConversations,
  getMoodEntries,
  addMoodEntry,
  getJournalEntries,
  addJournalEntry,
  addEmail,
  getEmails,
  ensureUserDir
};

