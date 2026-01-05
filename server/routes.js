// ============================================
// API ROUTES - routes.js
// Defines all API endpoints
// ============================================

import express from 'express';
import * as controller from './controller.js';

const router = express.Router();

// ========================================
// DEALS ROUTES
// ========================================

/**
 * GET /api/deals
 * Get all deals with filters
 * Query params: exchange, dealType, minDelivery, startDate, endDate, search, limit
 */
router.get('/deals', controller.getAllDeals);

/**
 * GET /api/deals/:symbol
 * Get all deals for a specific stock symbol
 * Params: symbol (e.g., RELIANCE, TCS)
 * Query params: limit
 */
router.get('/deals/:symbol', controller.getDealsBySymbol);

/**
 * POST /api/deals
 * Create a new deal (for testing/manual entry)
 * Body: { date, exchange, dealType, symbol, companyName, clientName, action, quantity, price }
 */
router.post('/deals', controller.createDeal);

// ========================================
// ANALYTICS ROUTES
// ========================================

/**
 * GET /api/analytics/accumulation
 * Get clients showing accumulation patterns
 * Query params: minDeals (default: 3)
 */
router.get('/analytics/accumulation', controller.getAccumulationPatterns);

/**
 * GET /api/analytics/top-clients
 * Get top clients by deal value
 * Query params: limit (default: 10)
 */
router.get('/analytics/top-clients', controller.getTopClients);

/**
 * GET /api/analytics/active-symbols
 * Get most active symbols by deal count
 * Query params: limit (default: 10)
 */
router.get('/analytics/active-symbols', controller.getActiveSymbols);

// ========================================
// STATISTICS ROUTES
// ========================================

/**
 * GET /api/stats
 * Get overall statistics
 */
router.get('/stats', controller.getStatistics);

// ========================================
// DELIVERY DATA ROUTES
// ========================================

/**
 * GET /api/delivery/:symbol
 * Get delivery data for a symbol
 * Params: symbol
 * Query params: date, exchange
 */
router.get('/delivery/:symbol', controller.getDeliveryData);

// ========================================
// SYSTEM ROUTES
// ========================================

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', controller.healthCheck);

/**
 * GET /api/logs
 * Get data fetch logs
 * Query params: days (default: 7)
 */
router.get('/logs', controller.getFetchLogs);

export default router;