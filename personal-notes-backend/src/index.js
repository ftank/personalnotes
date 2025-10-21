const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

// Import configurations
const { initializeFirebase } = require('./config/firebase');
const { initializeDatabase } = require('./config/database');
const { initializeRedis } = require('./config/redis');

// Import middleware
const { authenticateUser } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const conversationRoutes = require('./routes/conversations');
const goalRoutes = require('./routes/goals');
const resourceRoutes = require('./routes/resources');

// Import socket handler
const { setupSocketIO } = require('./services/socket');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Muitas requisições deste IP, tente novamente mais tarde'
});

app.use('/api/', generalLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', authenticateUser, userRoutes);
app.use('/api/conversations', authenticateUser, conversationRoutes);
app.use('/api/goals', authenticateUser, goalRoutes);
app.use('/api/resources', authenticateUser, resourceRoutes);

// Legal endpoints
app.get('/api/privacy-policy', (req, res) => {
  res.json({
    version: '1.0',
    lastUpdated: '2025-10-20',
    policy: 'URL_TO_PRIVACY_POLICY_OR_TEXT'
  });
});

app.get('/api/terms-of-service', (req, res) => {
  res.json({
    version: '1.0',
    lastUpdated: '2025-10-20',
    terms: 'URL_TO_TERMS_OF_SERVICE_OR_TEXT'
  });
});

// Error handling
app.use(errorHandler);

// Initialize services
const initializeServices = async () => {
  try {
    console.log('🔥 Initializing Firebase...');
    await initializeFirebase();

    console.log('🗄️  Initializing Database...');
    await initializeDatabase();

    console.log('🔴 Initializing Redis...');
    await initializeRedis();

    console.log('🔌 Setting up Socket.IO...');
    setupSocketIO(io);

    console.log('✅ All services initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing services:', error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 3000;

initializeServices().then(() => {
  server.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log(`\n📝 Personal Notes - Backend API\n`);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };
