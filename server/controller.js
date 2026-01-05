import * as queries from './database/queries.js';

/**
 * Get all deals with filters
 */
export async function getAllDeals(req, res) {
  try {
    const filters = {
      exchange: req.query.exchange || 'ALL',
      dealType: req.query.dealType || 'ALL',
      minDelivery: parseInt(req.query.minDelivery) || 0,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      search: req.query.search,
      limit: parseInt(req.query.limit) || 100
    };
    
    const deals = await queries.getDeals(filters);
    
    res.json({
      success: true,
      count: deals.length,
      filters: filters,
      deals: deals
    });
    
  } catch (error) {
    console.error('Controller error - getAllDeals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deals',
      message: error.message
    });
  }
}

/**
 * Get deals for specific symbol
 */
export async function getDealsBySymbol(req, res) {
  try {
    const { symbol } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Symbol is required'
      });
    }
    
    const deals = await queries.getDealsBySymbol(symbol, limit);
    
    res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      count: deals.length,
      deals: deals
    });
    
  } catch (error) {
    console.error('Controller error - getDealsBySymbol:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deals for symbol',
      message: error.message
    });
  }
}

/**
 * Create new deal (for testing/manual entry)
 */
export async function createDeal(req, res) {
  try {
    const dealData = req.body;
    
    // Validate required fields
    const requiredFields = ['date', 'exchange', 'dealType', 'symbol', 'clientName', 'action', 'quantity', 'price'];
    const missingFields = requiredFields.filter(field => !dealData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        missingFields: missingFields
      });
    }
    
    // Calculate deal value
    dealData.value = dealData.quantity * dealData.price;
    
    const dealId = await queries.insertDeal(dealData);
    
    // Update client pattern if it's a buy
    if (dealData.action === 'BUY') {
      await queries.updateClientPattern(dealData);
    }
    
    res.status(201).json({
      success: true,
      message: 'Deal created successfully',
      dealId: dealId
    });
    
  } catch (error) {
    console.error('Controller error - createDeal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create deal',
      message: error.message
    });
  }
}

// ========================================
// ANALYTICS CONTROLLERS
// ========================================

/**
 * Get accumulation patterns
 */
export async function getAccumulationPatterns(req, res) {
  try {
    const minDeals = parseInt(req.query.minDeals) || 3;
    
    const patterns = await queries.getAccumulationPatterns(minDeals);
    
    res.json({
      success: true,
      count: patterns.length,
      accumulationPatterns: patterns
    });
    
  } catch (error) {
    console.error('Controller error - getAccumulationPatterns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch accumulation patterns',
      message: error.message
    });
  }
}

/**
 * Get overall statistics
 */
export async function getStatistics(req, res) {
  try {
    const stats = await queries.getStats();
    const topClients = await queries.getTopClients(5);
    const activeSymbols = await queries.getActiveSymbols(5);
    
    res.json({
      success: true,
      stats: stats,
      topClients: topClients,
      activeSymbols: activeSymbols
    });
    
  } catch (error) {
    console.error('Controller error - getStatistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
}

/**
 * Get top clients by deal value
 */
export async function getTopClients(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const topClients = await queries.getTopClients(limit);
    
    res.json({
      success: true,
      count: topClients.length,
      topClients: topClients
    });
    
  } catch (error) {
    console.error('Controller error - getTopClients:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top clients',
      message: error.message
    });
  }
}

/**
 * Get most active symbols
 */
export async function getActiveSymbols(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const activeSymbols = await queries.getActiveSymbols(limit);
    
    res.json({
      success: true,
      count: activeSymbols.length,
      activeSymbols: activeSymbols
    });
    
  } catch (error) {
    console.error('Controller error - getActiveSymbols:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active symbols',
      message: error.message
    });
  }
}

// ========================================
// DELIVERY DATA CONTROLLERS
// ========================================

/**
 * Get delivery data for symbol
 */
export async function getDeliveryData(req, res) {
  try {
    const { symbol } = req.params;
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const exchange = req.query.exchange || 'NSE';
    
    const deliveryData = await queries.getDeliveryData(symbol, date, exchange);
    
    if (!deliveryData) {
      return res.status(404).json({
        success: false,
        error: 'Delivery data not found'
      });
    }
    
    res.json({
      success: true,
      deliveryData: deliveryData
    });
    
  } catch (error) {
    console.error('Controller error - getDeliveryData:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch delivery data',
      message: error.message
    });
  }
}

// ========================================
// SYSTEM CONTROLLERS
// ========================================

/**
 * Health check endpoint
 */
export async function healthCheck(req, res) {
  try {
    // Test database connection
    const result = await queries.getStats();
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      totalDeals: result.total_deals || 0
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
}

/**
 * Get fetch logs
 */
export async function getFetchLogs(req, res) {
  try {
    const days = parseInt(req.query.days) || 7;
    
    const logs = await queries.getFetchLogs(days);
    
    res.json({
      success: true,
      count: logs.length,
      logs: logs
    });
    
  } catch (error) {
    console.error('Controller error - getFetchLogs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch logs',
      message: error.message
    });
  }
}