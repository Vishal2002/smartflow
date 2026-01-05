import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './database/db.js';
import { setupDatabase } from './database/schema.js';
import routes from './routes.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;


app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to SmartFlow API!',
    version: '1.0.0'
  });
});

// API routes
app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});


async function startServer() {
  try {
    console.log('🚀 Starting SmartFlow Server...');
    console.log('================================');
    
    // Test database connection
    console.log('📊 Testing database connection...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }
    
    // Setup database (create tables if they don't exist)
    if (process.env.SETUP_DB === 'true') {
      console.log('🔧 Setting up database schema...');
      await setupDatabase();
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log('================================');
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();