import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './database/db.js';
import { setupDatabase } from './database/schema.js';
import routes from './routes.js';
import cronWorker from './cronWorker.js';
import { fetchAllData } from './service/fetchService.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const ENABLE_CRON = process.env.ENABLE_CRON === 'true';


// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
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
    message: 'Welcome to SmartFlow API! 📊',
    version: '1.0.0',
    cronStatus: ENABLE_CRON ? 'enabled' : 'disabled'
  });
});

// API routes
app.use('/api', routes);

app.get('/api/cron/status', (req, res) => {
  try {
    const history = cronWorker.getFetchHistory();
    
    res.json({
      success: true,
      cronEnabled: ENABLE_CRON,
      history: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get cron status'
    });
  }
});


app.post('/api/cron/trigger', async (req, res) => {
  try {
    console.log('🔧 Manual fetch triggered via API...');
    
    // Send immediate response
    res.json({
      success: true,
      message: 'Data fetch triggered. Check server logs for progress.'
    });
    
    // Run fetch in background
    fetchAllData()
      .then(result => {
        console.log('✅ Manual fetch completed:', result);
      })
      .catch(error => {
        console.error('❌ Manual fetch failed:', error);
      });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to trigger fetch'
    });
  }
});

/**
 * POST /api/cron/stop
 * Stop cron job
 */
app.post('/api/cron/stop', (req, res) => {
  try {
    if (!ENABLE_CRON) {
      return res.status(400).json({
        success: false,
        error: 'Cron is not enabled'
      });
    }
    
    cronWorker.stopCronJob();
    
    res.json({
      success: true,
      message: 'Cron job stopped'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to stop cron job'
    });
  }
});

/**
 * POST /api/cron/start
 * Start cron job
 */
app.post('/api/cron/start', (req, res) => {
  try {
    if (!ENABLE_CRON) {
      return res.status(400).json({
        success: false,
        error: 'Cron is not enabled. Set ENABLE_CRON=true in .env'
      });
    }
    
    cronWorker.startCronJob();
    
    res.json({
      success: true,
      message: 'Cron job started'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to start cron job'
    });
  }
});



// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ========================================
// SERVER INITIALIZATION
// ========================================

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
      console.log(`📊 Database: ${process.env.DB_NAME || 'smartflow'}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⏰ Cron Jobs: ${ENABLE_CRON ? 'ENABLED ✅' : 'DISABLED ⚠️'}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, shutting down gracefully...');
  if (ENABLE_CRON) {
    cronWorker.stopCronJob();
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received, shutting down gracefully...');
  if (ENABLE_CRON) {
    cronWorker.stopCronJob();
  }
  process.exit(0);
});

// Start the server
startServer();