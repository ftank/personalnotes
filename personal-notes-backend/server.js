require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Import configs
const { Server } = require('socket.io');
const { setupSocketIO } = require('./src/services/socket');
const { initializeRedis } = require('./src/config/redis');
const { initializeFirebase } = require('./src/config/firebase');
const { initializeDatabase } = require('./src/config/database');

// Import middleware
const { errorHandler } = require('./src/middleware/errorHandler');
const { authenticateUser } = require('./src/middleware/auth');

// Import routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/user');
const conversationsRoutes = require('./src/routes/conversations');
const goalsRoutes = require('./src/routes/goals');
const resourcesRoutes = require('./src/routes/resources');

// Initialize Express
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }
});

// Setup Socket.IO handlers
setupSocketIO(io);

// Environment variables
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// CORS configuration
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting - mais permissivo em desenvolvimento
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Aumentado para desenvolvimento
  message: 'Muitas requisições deste IP, tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development', // Desabilita em dev
});

// Apply rate limiting to all routes (disabled in development)
if (process.env.NODE_ENV !== 'development') {
  app.use('/api/', limiter);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', authenticateUser, userRoutes);
app.use('/api/conversations', authenticateUser, conversationsRoutes);
app.use('/api/goals', authenticateUser, goalsRoutes);
app.use('/api/resources', authenticateUser, resourcesRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'Rota não encontrada',
    path: req.path,
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\n🛑 Recebido sinal de encerramento...');

  // Close server
  server.close(() => {
    console.log('✅ Servidor HTTP encerrado');
  });

  // Close Socket.IO
  io.close(() => {
    console.log('✅ Socket.IO encerrado');
  });

  // Close database connections (if needed)
  // await db.end();

  // Close Redis connections (if needed)
  // await redis.quit();

  console.log('👋 Aplicação encerrada com sucesso');
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
server.listen(PORT, async () => {
  console.log('\n🚀 Personal Notes - Backend');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 Servidor rodando em: http://localhost:${PORT}`);
  console.log(`🌍 Ambiente: ${NODE_ENV}`);
  console.log(`🔗 Frontend URL: ${FRONTEND_URL}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Initialize Firebase
  try {
    console.log('🔥 Inicializando Firebase...');
    await initializeFirebase();
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase:', error.message);
    console.error('⚠️  A autenticação não funcionará!');
  }

  // Initialize Database
  try {
    console.log('🗄️  Inicializando Database...');
    await initializeDatabase();

    // Run migrations automatically on first deploy
    if (process.env.AUTO_MIGRATE === 'true') {
      console.log('🔄 Running database migrations...');
      const { query } = require('./src/config/database');
      const fs = require('fs');
      const path = require('path');

      try {
        const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await query(schemaSQL);
        console.log('✅ Database migrations completed successfully!');
      } catch (migrationError) {
        // Ignore errors if tables already exist
        if (migrationError.message.includes('already exists')) {
          console.log('ℹ️  Database schema already exists, skipping migration');
        } else {
          console.error('⚠️  Migration error:', migrationError.message);
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro ao inicializar Database:', error.message);
    console.error('⚠️  O banco de dados não está disponível!');
  }

  // Try to initialize Redis (optional)
  console.log('🔄 Tentando conectar ao Redis...');
  const redis = await initializeRedis();
  if (!redis) {
    console.log('⚠️  Redis não disponível - aplicação funcionará sem cache');
  }

  console.log('\n✅ Rotas disponíveis:');
  console.log('   GET  /health');
  console.log('   POST /api/auth/verify');
  console.log('   POST /api/auth/logout');
  console.log('   GET  /api/user/profile');
  console.log('   DELETE /api/user/delete-account');
  console.log('   GET  /api/user/export-data');
  console.log('   POST /api/user/consent');
  console.log('   GET  /api/conversations');
  console.log('   POST /api/conversations');
  console.log('   GET  /api/conversations/:id');
  console.log('   PUT  /api/conversations/:id');
  console.log('   DELETE /api/conversations/:id');
  console.log('   GET  /api/conversations/:id/messages');
  console.log('   GET  /api/goals');
  console.log('   POST /api/goals');
  console.log('   PUT  /api/goals/:id');
  console.log('   DELETE /api/goals/:id');
  console.log('   POST /api/goals/:id/checkin');
  console.log('   GET  /api/resources');
  console.log('   GET  /api/resources/emergency');
  console.log('\n🔌 Socket.IO pronto para conexões');
  console.log('\n⏳ Aguardando requisições...\n');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = { app, server, io };
