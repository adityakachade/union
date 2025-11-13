const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Check if .env file exists (only in development)
// In production (Render, etc.), environment variables are set in the platform
// Check if we're in production by looking for platform-specific env vars or NODE_ENV
const isProduction = process.env.NODE_ENV === 'production' || 
                      process.env.RENDER || 
                      process.env.VERCEL ||
                      process.env.HEROKU ||
                      (process.env.DB_HOST && !process.env.DB_HOST.includes('localhost'));

if (!isProduction) {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('\n❌ ERROR: .env file not found!');
    console.error('\n📝 Please create a .env file in the backend directory.');
    console.error('   You can copy .env.example to .env and update it with your database credentials.');
    console.error('\n💡 For free PostgreSQL database setup, see: DATABASE_SETUP.md');
    console.error('\n   Quick setup:');
    console.error('   1. cd backend');
    console.error('   2. cp .env.example .env');
    console.error('   3. Edit .env with your database credentials');
    console.error('\n');
    process.exit(1);
  }
} else {
  console.log('🌍 Production/Platform mode: Using environment variables from platform');
  // Verify critical environment variables are set
  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD) {
    console.error('\n⚠️  WARNING: Some database environment variables are missing!');
    console.error('   Please ensure DB_HOST, DB_USER, and DB_PASSWORD are set in your platform.');
  }
}

const { sequelize } = require('./models');
const routes = require('./routes');
const { initializeSocket } = require('./services/socketService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Socket.io
initializeSocket(io);

// Routes
app.use('/api/v1', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Render provides PORT environment variable, default to 5000 for local dev
const PORT = process.env.PORT || 5000;

// Database connection and server start
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'crm_db',
  username: process.env.DB_USER || 'postgres'
};

console.log('\n🔌 Attempting to connect to database...');
console.log(`   Host: ${dbConfig.host}`);
console.log(`   Port: ${dbConfig.port}`);
console.log(`   Database: ${dbConfig.database}`);
console.log(`   User: ${dbConfig.username}`);
console.log('');

sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connection established successfully.');
    
    // Sync database (in development, use migrations in production)
    if (process.env.NODE_ENV === 'development') {
      return sequelize.sync({ alter: false });
    }
  })
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 WebSocket server initialized`);
      console.log(`\n✨ Ready to accept connections!\n`);
    });
  })
  .catch((err) => {
    console.error('\n❌ Unable to connect to the database!\n');
    
    if (err.original && err.original.code === 'ECONNREFUSED') {
      console.error('💡 Connection Refused Error:');
      console.error('   The database server is not running or not accessible.');
      console.error('\n📋 Troubleshooting steps:');
      console.error('   1. Check if your database server is running');
      console.error('   2. Verify your .env file has correct credentials:');
      console.error(`      DB_HOST=${dbConfig.host}`);
      console.error(`      DB_PORT=${dbConfig.port}`);
      console.error(`      DB_NAME=${dbConfig.database}`);
      console.error(`      DB_USER=${dbConfig.username}`);
      console.error('      DB_PASSWORD=***');
      console.error('\n   3. For cloud databases (Supabase, Neon, etc.):');
      console.error('      - Verify the host address is correct');
      console.error('      - Check if your IP is whitelisted (if required)');
      console.error('      - Ensure SSL is configured if needed');
      console.error('\n   4. For local PostgreSQL:');
      console.error('      - Make sure PostgreSQL is running: brew services start postgresql (macOS)');
      console.error('      - Or: sudo systemctl start postgresql (Linux)');
      console.error('\n📖 See DATABASE_SETUP.md for detailed setup instructions\n');
    } else if (err.original && err.original.code === 'ENOTFOUND') {
      console.error('💡 Host Not Found Error:');
      console.error(`   Cannot resolve hostname: ${dbConfig.host}`);
      console.error('   Please check your DB_HOST in .env file\n');
    } else if (err.original && err.original.code === '28P01') {
      console.error('💡 Authentication Failed:');
      console.error('   Invalid username or password');
      console.error('   Please check your DB_USER and DB_PASSWORD in .env file\n');
    } else if (err.original && err.original.code === '3D000') {
      console.error('💡 Database Not Found:');
      console.error(`   Database "${dbConfig.database}" does not exist`);
      console.error('   Please create the database or update DB_NAME in .env file\n');
    } else {
      console.error('Error details:', err.message);
      if (err.original) {
        console.error('Original error:', err.original.message);
      }
    }
    
    console.error('Full error:', err);
    process.exit(1);
  });

module.exports = { app, server, io };

