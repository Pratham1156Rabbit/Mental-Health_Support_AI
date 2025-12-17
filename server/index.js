const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const csvStorage = require('./utils/csvStorage');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// OpenRouter configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo'; // Default model
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// OTP storage (temporary - in memory, cleared after use)
const otpStore = {}; // { username: { otp, type, expiresAt, userData? } }

// JWT Secret (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Email configuration (Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD // Use App Password, not regular password
  }
});

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email and store in CSV
const sendOTPEmail = async (email, otp, type, username = null) => {
  const subject = type === 'verification' 
    ? 'Verify Your Email - Mental Health AI' 
    : 'Password Reset OTP - Mental Health AI';
  
  const html = type === 'verification'
    ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">Email Verification</h2>
        <p>Thank you for signing up! Please verify your email address by entering the OTP below:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
          <h1 style="color: #667eea; letter-spacing: 5px; margin: 0;">${otp}</h1>
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p style="color: #666; font-size: 12px;">If you didn't create an account, please ignore this email.</p>
      </div>
    `
    : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">Password Reset</h2>
        <p>You requested to reset your password. Please enter the OTP below to proceed:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
          <h1 style="color: #667eea; letter-spacing: 5px; margin: 0;">${otp}</h1>
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p style="color: #666; font-size: 12px;">If you didn't request a password reset, please ignore this email.</p>
      </div>
    `;

  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: subject,
      html: html
    });

    // Store email in CSV
    csvStorage.addEmail({
      id: Date.now().toString(),
      to: email,
      subject: subject,
      type: type,
      otp: otp,
      sentAt: new Date().toISOString(),
      username: username || ''
    });

    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
};

// Authentication Routes
// Register - Step 1: Send OTP for email verification
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, name } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Username validation
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if username already exists
    const existingUserByUsername = csvStorage.getUserByUsername(username);
    if (existingUserByUsername) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Check if email already exists
    const existingUserByEmail = csvStorage.getUserByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP with user data temporarily
    otpStore[username] = {
      otp,
      type: 'verification',
      expiresAt,
      userData: { username, email: email.toLowerCase(), password, name: name || username }
    };

    // Send OTP email
    const emailSent = await sendOTPEmail(email.toLowerCase(), otp, 'verification', username);
    
    if (!emailSent) {
      delete otpStore[username];
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    res.json({
      success: true,
      message: 'Verification OTP sent to your email'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Verify OTP and complete registration
app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const { username, otp } = req.body;

    if (!username || !otp) {
      return res.status(400).json({ error: 'Username and OTP are required' });
    }

    const storedOTP = otpStore[username];

    if (!storedOTP || storedOTP.type !== 'verification') {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    if (Date.now() > storedOTP.expiresAt) {
      delete otpStore[username];
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (storedOTP.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // OTP verified, create user
    const { userData } = storedOTP;
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = {
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
      emailVerified: 'true',
      createdAt: new Date().toISOString()
    };

    // Save to CSV
    csvStorage.createUser(user);

    // Clean up OTP
    delete otpStore[username];

    // Generate token
    const token = jwt.sign(
      { username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        username: user.username,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    if (error.message === 'Username already exists' || error.message === 'Email already exists') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// Resend OTP for registration
app.post('/api/auth/resend-otp', async (req, res) => {
  try {
    const { username, email, type } = req.body; // type: 'verification' or 'reset'

    if (!type) {
      return res.status(400).json({ error: 'Type is required' });
    }

    if (type === 'verification') {
      if (!username) {
        return res.status(400).json({ error: 'Username is required' });
      }

      const storedOTP = otpStore[username];
      if (!storedOTP || !storedOTP.userData) {
        return res.status(400).json({ error: 'No pending registration found' });
      }

      const otp = generateOTP();
      const expiresAt = Date.now() + 10 * 60 * 1000;

      otpStore[username] = {
        ...storedOTP,
        otp,
        expiresAt
      };

      const emailSent = await sendOTPEmail(storedOTP.userData.email, otp, 'verification', username);
      
      if (!emailSent) {
        return res.status(500).json({ error: 'Failed to send OTP email' });
      }

      res.json({ success: true, message: 'OTP resent to your email' });
    } else if (type === 'reset') {
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const user = csvStorage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const otp = generateOTP();
      const expiresAt = Date.now() + 10 * 60 * 1000;

      otpStore[user.username] = {
        otp,
        type: 'reset',
        expiresAt,
        username: user.username
      };

      const emailSent = await sendOTPEmail(email.toLowerCase(), otp, 'reset', user.username);
      
      if (!emailSent) {
        return res.status(500).json({ error: 'Failed to send OTP email' });
      }

      res.json({ success: true, message: 'Password reset OTP sent to your email' });
    }
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
});

// Login (can use username or email)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    if (!username && !email) {
      return res.status(400).json({ error: 'Username or email is required' });
    }

    // Find user by username or email
    let user = null;
    if (username) {
      user = csvStorage.getUserByUsername(username);
    } else if (email) {
      user = csvStorage.getUserByEmail(email);
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if email is verified
    if (user.emailVerified !== 'true') {
      return res.status(403).json({ 
        error: 'Email not verified. Please verify your email first.',
        requiresVerification: true
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Load user history from CSV
    const conversations = csvStorage.getConversations(user.username);
    const moodEntries = csvStorage.getMoodEntries(user.username);
    const journalEntries = csvStorage.getJournalEntries(user.username);

    // Generate token
    const token = jwt.sign(
      { username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        username: user.username,
        email: user.email,
        name: user.name
      },
      history: {
        conversations: conversations.length,
        moodEntries: moodEntries.length,
        journalEntries: journalEntries.length
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Request password reset OTP
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = csvStorage.getUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists for security
      return res.json({ success: true, message: 'If the email exists, an OTP has been sent' });
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore[user.username] = {
      otp,
      type: 'reset',
      expiresAt,
      username: user.username
    };

    const emailSent = await sendOTPEmail(email.toLowerCase(), otp, 'reset', user.username);
    
    if (!emailSent) {
      delete otpStore[user.username];
      return res.status(500).json({ error: 'Failed to send password reset email' });
    }

    res.json({ success: true, message: 'Password reset OTP sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Verify OTP and reset password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { username, email, otp, newPassword } = req.body;

    if (!otp || !newPassword) {
      return res.status(400).json({ error: 'OTP and new password are required' });
    }

    if (!username && !email) {
      return res.status(400).json({ error: 'Username or email is required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Find user to get username
    let user = null;
    if (username) {
      user = csvStorage.getUserByUsername(username);
    } else if (email) {
      user = csvStorage.getUserByEmail(email);
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const storedOTP = otpStore[user.username];

    if (!storedOTP || storedOTP.type !== 'reset') {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    if (Date.now() > storedOTP.expiresAt) {
      delete otpStore[user.username];
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (storedOTP.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // OTP verified, reset password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    csvStorage.updateUser(user.username, { password: hashedPassword });

    // Clean up OTP
    delete otpStore[user.username];

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Verify token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  const user = csvStorage.getUserByUsername(req.user.username);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Load user history
  const conversations = csvStorage.getConversations(user.username);
  const moodEntries = csvStorage.getMoodEntries(user.username);
  const journalEntries = csvStorage.getJournalEntries(user.username);

  res.json({
    success: true,
    user: {
      username: user.username,
      email: user.email,
      name: user.name
    },
    history: {
      conversations: conversations.length,
      moodEntries: moodEntries.length,
      journalEntries: journalEntries.length
    }
  });
});

// Mental health support system prompt
const SYSTEM_PROMPT = `You are Rabbit 🐰, a cheerful, positive, and humorous AI companion whose main goal is to make users happy and bring joy to their lives. Your personality is:

- EXTREMELY POSITIVE and OPTIMISTIC - Always find the silver lining and focus on hope
- HUMOROUS and PLAYFUL - Make appropriate jokes, puns, and light-hearted comments to lift spirits
- WARM and COMFORTING - Like a caring friend who wants to see them smile
- ENCOURAGING - Help users see their strengths and potential
- UPLIFTING - When users express sadness, anxiety, or negative feelings, respond with:
  * Gentle humor and jokes to lighten the mood
  * Positive reframing of situations
  * Hope and encouragement
  * Light-hearted distractions
  * Reminders of good things in life

When users say things like "I'm sad", "not feeling great", "please make me happy", etc.:
- Respond with genuine warmth and positivity
- Share a funny joke, pun, or light-hearted story
- Offer hopeful perspectives
- Use emojis appropriately (🐰 😊 🌟 💪 🎉)
- Be like a friend trying to cheer them up

IMPORTANT:
- Keep responses light, positive, and hopeful
- Use humor appropriately to comfort and cheer up users
- Never be preachy or dismissive of their feelings
- Still acknowledge their emotions but help them see brighter possibilities
- In serious crisis situations, provide resources but maintain a supportive, hopeful tone

Your mission: Make users smile, laugh, and feel better! Spread positivity and joy! 🐰✨`;

// Get chat list (protected)
app.get('/api/chats', authenticateToken, (req, res) => {
  try {
    const username = req.user.username;
    const chatList = csvStorage.getChatList(username);
    res.json({ chats: chatList });
  } catch (error) {
    console.error('Get chat list error:', error);
    res.status(500).json({ error: 'Failed to retrieve chat list' });
  }
});

// Soft-delete a chat (frontend won't see it anymore; backend keeps messages)
app.post('/api/chats/:chatId/delete', authenticateToken, (req, res) => {
  try {
    const username = req.user.username;
    const { chatId } = req.params;

    if (!chatId) return res.status(400).json({ error: 'chatId is required' });

    csvStorage.addDeletedChat(username, chatId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

// Get messages for a specific chat (protected)
app.get('/api/chat/:chatId', authenticateToken, (req, res) => {
  try {
    const username = req.user.username;
    const { chatId } = req.params;
    if (csvStorage.isChatDeleted(username, chatId)) {
      return res.status(410).json({ error: 'Chat deleted' });
    }
    const messages = csvStorage.getConversations(username, chatId);
    res.json({ messages });
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({ error: 'Failed to retrieve chat messages' });
  }
});

// Chat endpoint (protected)
app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const { message, chatId } = req.body;
    const username = req.user.username;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Generate chatId if not provided (new chat)
    const currentChatId = chatId || `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Load conversation history for this specific chat
    let conversations = csvStorage.getConversations(username, currentChatId);
    
    // Convert to format needed for API
    const conversationMessages = conversations.map(c => ({
      role: c.role,
      content: c.content
    }));

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      chatId: currentChatId,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    csvStorage.addConversation(username, userMessage);
    conversationMessages.push({ role: 'user', content: message });

    let response;

    if (OPENROUTER_API_KEY) {
      // Use OpenRouter API
      try {
        const completion = await axios.post(
          OPENROUTER_API_URL,
          {
            model: OPENROUTER_MODEL,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              ...conversationMessages.slice(-20) // Last 20 messages
            ],
            temperature: 0.7,
            max_tokens: 500
          },
          {
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
              'X-Title': 'Mental Health AI'
            }
          }
        );

        response = completion.data.choices[0].message.content;
      } catch (error) {
        console.error('OpenRouter API error:', error.response?.data || error.message);
        response = generateFallbackResponse(message);
      }
    } else {
      response = generateFallbackResponse(message);
    }

    // Add assistant response to CSV
    const assistantMessage = {
      id: (Date.now() + 1).toString(),
      chatId: currentChatId,
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString()
    };
    csvStorage.addConversation(username, assistantMessage);

    res.json({ response, chatId: currentChatId, username });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Sorry, I encountered an error. Please try again.',
      fallback: generateFallbackResponse(req.body.message || '')
    });
  }
});

// Public chat endpoint (NO auth, NO storage)
// - Lets guests try Rabbit without creating an account
// - Does not save messages or create chat history
app.post('/api/public-chat', async (req, res) => {
  try {
    const { message, history } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const trimmed = message.trim();

    const safeHistory = Array.isArray(history)
      ? history
          .filter(h => h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string')
          .slice(-20)
          .map(h => ({ role: h.role, content: h.content }))
      : [];

    let response;

    if (OPENROUTER_API_KEY) {
      try {
        const completion = await axios.post(
          OPENROUTER_API_URL,
          {
            model: OPENROUTER_MODEL,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              ...safeHistory,
              { role: 'user', content: trimmed }
            ],
            temperature: 0.7,
            max_tokens: 500
          },
          {
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
              'X-Title': 'Mental Health AI'
            }
          }
        );

        response = completion.data.choices[0].message.content;
      } catch (error) {
        console.error('OpenRouter public chat error:', error.response?.data || error.message);
        response = generateFallbackResponse(trimmed);
      }
    } else {
      response = generateFallbackResponse(trimmed);
    }

    res.json({ response });
  } catch (error) {
    console.error('Public chat error:', error);
    res.status(500).json({
      error: 'Sorry, I encountered an error. Please try again.',
      fallback: generateFallbackResponse(req.body?.message || '')
    });
  }
});

// Mood tracking endpoint (protected)
app.post('/api/mood', authenticateToken, (req, res) => {
  try {
    const { mood, note, timestamp } = req.body;
    const username = req.user.username;

    if (!mood) {
      return res.status(400).json({ error: 'Mood is required' });
    }

    const entry = {
      id: Date.now().toString(),
      mood,
      note: note || '',
      timestamp: timestamp || new Date().toISOString()
    };

    csvStorage.addMoodEntry(username, entry);

    res.json({ success: true, entry });
  } catch (error) {
    console.error('Mood tracking error:', error);
    res.status(500).json({ error: 'Failed to save mood entry' });
  }
});

// Get mood history (protected)
app.get('/api/mood', authenticateToken, (req, res) => {
  try {
    const username = req.user.username;
    const entries = csvStorage.getMoodEntries(username);
    res.json({ entries });
  } catch (error) {
    console.error('Get mood error:', error);
    res.status(500).json({ error: 'Failed to retrieve mood entries' });
  }
});

// Journal entry endpoint (protected)
app.post('/api/journal', authenticateToken, (req, res) => {
  try {
    const { content, timestamp } = req.body;
    const username = req.user.username;

    if (!content) {
      return res.status(400).json({ error: 'Journal content is required' });
    }

    const entry = {
      id: Date.now().toString(),
      content,
      timestamp: timestamp || new Date().toISOString()
    };

    csvStorage.addJournalEntry(username, entry);

    res.json({ success: true, entry });
  } catch (error) {
    console.error('Journal error:', error);
    res.status(500).json({ error: 'Failed to save journal entry' });
  }
});

// Get journal entries (protected)
app.get('/api/journal', authenticateToken, (req, res) => {
  try {
    const username = req.user.username;
    const entries = csvStorage.getJournalEntries(username);
    res.json({ entries });
  } catch (error) {
    console.error('Get journal error:', error);
    res.status(500).json({ error: 'Failed to retrieve journal entries' });
  }
});

// Crisis resources endpoint
app.get('/api/resources', (req, res) => {
  const resources = {
    crisis: {
      nationalSuicidePrevention: {
        name: 'National Suicide Prevention Lifeline',
        phone: '988',
        website: 'https://988lifeline.org/'
      },
      crisisTextLine: {
        name: 'Crisis Text Line',
        text: 'Text HOME to 741741',
        website: 'https://www.crisistextline.org/'
      }
    },
    general: [
      {
        name: 'National Alliance on Mental Illness (NAMI)',
        website: 'https://www.nami.org/',
        description: 'Education, support, and advocacy for mental health'
      },
      {
        name: 'Mental Health America',
        website: 'https://www.mhanational.org/',
        description: 'Resources and tools for mental wellness'
      }
    ]
  };

  res.json(resources);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Fallback response generator (when AI is not available) - Positive and humorous
function generateFallbackResponse(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('sad') || lowerMessage.includes('depressed') || lowerMessage.includes('down') || lowerMessage.includes('unhappy')) {
    const jokes = [
      "Why don't scientists trust atoms? Because they make up everything! 😄 But seriously, I know things might feel tough right now, but remember - even the darkest nights end with a sunrise. You've got this! 🌅",
      "What do you call a fake noodle? An impasta! 🍝 Hehe! But you know what? Every cloud has a silver lining, and I believe brighter days are ahead for you! Keep your chin up! ✨",
      "Why did the scarecrow win an award? He was outstanding in his field! 🌾 Okay, corny joke aside - I want you to know that tough times don't last, but tough people like you do! You're stronger than you think! 💪"
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }
  
  if (lowerMessage.includes('make me happy') || lowerMessage.includes('cheer me up') || lowerMessage.includes('make me feel better')) {
    const happyResponses = [
      "Did you know that laughing for just 15 minutes can burn up to 40 calories? So let's laugh together! 😂 Here's a joke: Why don't eggs tell jokes? They'd crack each other up! 🥚 But more importantly, you're amazing just for being you! Remember all the good things in your life - even the small ones count! 🌟",
      "Here's something to smile about: A group of bunnies is called a 'fluffle' - how adorable is that? 🐰💕 You know what else is adorable? You taking the time to care about your happiness! That's a beautiful thing! Keep spreading that positive energy! ✨",
      "Why did the math book look so sad? Because it had too many problems! 📚😄 But hey, you know what? You're not a math problem - you're a solution! You have the power to turn things around, and I believe in you! Let's focus on what makes you smile! 😊"
    ];
    return happyResponses[Math.floor(Math.random() * happyResponses.length)];
  }
  
  if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety') || lowerMessage.includes('worried') || lowerMessage.includes('stressed')) {
    return "Why did the coffee file a police report? It got mugged! ☕😄 I know anxiety can feel overwhelming, but remember - you've handled 100% of your worst days so far! That's pretty amazing! Take a deep breath with me... in... and out... You've got this! 🌈";
  }
  
  if (lowerMessage.includes('tired') || lowerMessage.includes('exhausted') || lowerMessage.includes('worn out')) {
    return "Why did the bicycle fall over? Because it was two-tired! 🚲😄 I totally get feeling worn out - life can be exhausting! But remember, even superheroes need rest. You're doing great, and it's okay to take breaks. Tomorrow is a fresh start! 🌅";
  }
  
  if (lowerMessage.includes('help') || lowerMessage.includes('crisis') || lowerMessage.includes('suicide')) {
    return "If you're in immediate danger, please call 988 (Suicide & Crisis Lifeline) or 911. You can also text HOME to 741741 for 24/7 crisis support. Your life matters, and there are people ready to help you right now. But I also want you to know - there's so much light ahead, even when it's hard to see. You're valuable and loved! 💙";
  }
  
  // Default positive response
  const defaultResponses = [
    "Hey there! 🐰 I'm so glad you're here! How can I help brighten your day today? I'm all ears (and floppy ones at that)! 😊",
    "Hello! It's wonderful to chat with you! What's on your mind? I'm here to listen and hopefully bring a smile to your face! 🌟",
    "Hi there! Thanks for reaching out! I'm Rabbit, and I'm here to help make your day a little brighter. What would you like to talk about? 😄"
  ];
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

app.listen(PORT, () => {
  console.log(`Mental Health AI server running on port ${PORT}`);
  console.log(`OpenRouter configured: ${OPENROUTER_API_KEY ? 'Yes' : 'No (using fallback responses)'}`);
  if (OPENROUTER_API_KEY) {
    console.log(`Using model: ${OPENROUTER_MODEL}`);
    console.log(`API Key: ${OPENROUTER_API_KEY.substring(0, 10)}...${OPENROUTER_API_KEY.substring(OPENROUTER_API_KEY.length - 4)}`);
  } else {
    console.log('⚠️  WARNING: No OPENROUTER_API_KEY found in environment variables!');
    console.log('   Create a .env file in the server directory with your OpenRouter API key.');
    console.log('   Example: cp env.example .env');
  }
});