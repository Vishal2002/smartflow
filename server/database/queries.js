// ============================================
// DATABASE QUERIES - queries.js
// All database operations
// ============================================

import { pool } from './db.js';

// ========================================
// DEALS OPERATIONS
// ========================================

/**
 * Insert a new deal into database
 */
export async function insertDeal(dealData) {
  const query = `
    INSERT INTO deals (
      deal_date, exchange, deal_type, symbol, company_name,
      client_name, action, quantity, price, deal_value
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id
  `;
  
  const values = [
    dealData.date,
    dealData.exchange,
    dealData.dealType,
    dealData.symbol,
    dealData.companyName,
    dealData.clientName,
    dealData.action,
    dealData.quantity,
    dealData.price,
    dealData.value
  ];
  
  try {
    const result = await pool.query(query, values);
    return result.rows[0].id;
  } catch (error) {
    console.error('Error inserting deal:', error.message);
    throw error;
  }
}

/**
 * Get all deals with filters
 */
export async function getDeals(filters = {}) {
  let query = `SELECT * FROM enriched_deals WHERE 1=1`;
  const params = [];
  let paramIndex = 1;
  
  // Filter by exchange
  if (filters.exchange && filters.exchange !== 'ALL') {
    query += ` AND exchange = $${paramIndex}`;
    params.push(filters.exchange);
    paramIndex++;
  }
  
  // Filter by deal type
  if (filters.dealType && filters.dealType !== 'ALL') {
    query += ` AND deal_type = $${paramIndex}`;
    params.push(filters.dealType);
    paramIndex++;
  }
  
  // Filter by minimum delivery
  if (filters.minDelivery) {
    query += ` AND delivery_percent >= $${paramIndex}`;
    params.push(filters.minDelivery);
    paramIndex++;
  }
  
  // Filter by date range
  if (filters.startDate) {
    query += ` AND deal_date >= $${paramIndex}`;
    params.push(filters.startDate);
    paramIndex++;
  }
  
  if (filters.endDate) {
    query += ` AND deal_date <= $${paramIndex}`;
    params.push(filters.endDate);
    paramIndex++;
  }
  
  // Search filter
  if (filters.search) {
    query += ` AND (
      symbol ILIKE $${paramIndex} OR
      company_name ILIKE $${paramIndex} OR
      client_name ILIKE $${paramIndex}
    )`;
    params.push(`%${filters.search}%`);
    paramIndex++;
  }
  
  // Order and limit
  query += ` ORDER BY deal_date DESC, confidence_score DESC`;
  
  if (filters.limit) {
    query += ` LIMIT $${paramIndex}`;
    params.push(filters.limit);
  }
  
  try {
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error fetching deals:', error.message);
    throw error;
  }
}

/**
 * Get deals for specific symbol
 */
export async function getDealsBySymbol(symbol, limit = 50) {
  const query = `
    SELECT * FROM enriched_deals
    WHERE symbol = $1
    ORDER BY deal_date DESC
    LIMIT $2
  `;
  
  try {
    const result = await pool.query(query, [symbol.toUpperCase(), limit]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching deals by symbol:', error.message);
    throw error;
  }
}

// ========================================
// DELIVERY DATA OPERATIONS
// ========================================

/**
 * Insert delivery data
 */
export async function insertDeliveryData(deliveryData) {
  const query = `
    INSERT INTO delivery_data (
      symbol, trade_date, exchange, traded_quantity,
      delivered_quantity, delivery_percent
    ) VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (symbol, trade_date, exchange) 
    DO UPDATE SET
      traded_quantity = EXCLUDED.traded_quantity,
      delivered_quantity = EXCLUDED.delivered_quantity,
      delivery_percent = EXCLUDED.delivery_percent
    RETURNING id
  `;
  
  const values = [
    deliveryData.symbol,
    deliveryData.date,
    deliveryData.exchange,
    deliveryData.tradedQuantity,
    deliveryData.deliveredQuantity,
    deliveryData.deliveryPercent
  ];
  
  try {
    const result = await pool.query(query, values);
    return result.rows[0].id;
  } catch (error) {
    console.error('Error inserting delivery data:', error.message);
    throw error;
  }
}

/**
 * Get delivery data for symbol and date
 */
export async function getDeliveryData(symbol, date, exchange = 'NSE') {
  const query = `
    SELECT * FROM delivery_data
    WHERE symbol = $1 AND trade_date = $2 AND exchange = $3
  `;
  
  try {
    const result = await pool.query(query, [symbol, date, exchange]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching delivery data:', error.message);
    throw error;
  }
}

// ========================================
// CLIENT PATTERNS OPERATIONS
// ========================================

/**
 * Update client pattern (accumulation tracking)
 */
export async function updateClientPattern(deal) {
  if (deal.action !== 'BUY') return; // Only track buys
  
  const query = `
    INSERT INTO client_patterns (
      client_name, symbol, total_buy_deals, total_buy_quantity,
      total_buy_value, first_buy_date, last_buy_date, consecutive_buys,
      is_accumulating, last_updated
    ) VALUES ($1, $2, 1, $3, $4, $5, $5, 1, TRUE, NOW())
    ON CONFLICT (client_name, symbol) 
    DO UPDATE SET
      total_buy_deals = client_patterns.total_buy_deals + 1,
      total_buy_quantity = client_patterns.total_buy_quantity + $3,
      total_buy_value = client_patterns.total_buy_value + $4,
      last_buy_date = $5,
      consecutive_buys = client_patterns.consecutive_buys + 1,
      is_accumulating = TRUE,
      last_updated = NOW()
  `;
  
  const values = [
    deal.clientName,
    deal.symbol,
    deal.quantity,
    deal.value,
    deal.date
  ];
  
  try {
    await pool.query(query, values);
    return true;
  } catch (error) {
    console.error('Error updating client pattern:', error.message);
    throw error;
  }
}

/**
 * Get accumulation patterns
 */
export async function getAccumulationPatterns(minDeals = 3) {
  const query = `
    SELECT 
      client_name,
      symbol,
      total_buy_deals,
      total_buy_quantity,
      total_buy_value,
      avg_holding_days,
      avg_delivery_percent,
      consecutive_buys,
      last_buy_date
    FROM client_patterns
    WHERE is_accumulating = TRUE
      AND total_buy_deals >= $1
    ORDER BY total_buy_value DESC
    LIMIT 50
  `;
  
  try {
    const result = await pool.query(query, [minDeals]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching accumulation patterns:', error.message);
    throw error;
  }
}

// ========================================
// STATISTICS
// ========================================

/**
 * Get overall statistics
 */
export async function getStats() {
  const query = `
    SELECT 
      COUNT(*) as total_deals,
      COUNT(CASE WHEN deal_date = CURRENT_DATE THEN 1 END) as today_deals,
      COUNT(CASE WHEN holding_type = 'STRONG_LONGTERM' THEN 1 END) as strong_longterm,
      COUNT(CASE WHEN is_accumulating THEN 1 END) as accumulation_patterns,
      AVG(delivery_percent)::DECIMAL(5,2) as avg_delivery_percent
    FROM enriched_deals
    WHERE deal_date >= CURRENT_DATE - INTERVAL '30 days'
  `;
  
  try {
    const result = await pool.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching stats:', error.message);
    throw error;
  }
}

/**
 * Get top clients by deal value
 */
export async function getTopClients(limit = 10) {
  const query = `
    SELECT 
      client_name,
      COUNT(*) as total_deals,
      SUM(deal_value) as total_value,
      AVG(delivery_percent)::DECIMAL(5,2) as avg_delivery
    FROM enriched_deals
    WHERE deal_date >= CURRENT_DATE - INTERVAL '30 days'
      AND action = 'BUY'
    GROUP BY client_name
    ORDER BY total_value DESC
    LIMIT $1
  `;
  
  try {
    const result = await pool.query(query, [limit]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching top clients:', error.message);
    throw error;
  }
}

/**
 * Get most active symbols
 */
export async function getActiveSymbols(limit = 10) {
  const query = `
    SELECT 
      symbol,
      company_name,
      COUNT(*) as deal_count,
      SUM(deal_value) as total_value,
      AVG(delivery_percent)::DECIMAL(5,2) as avg_delivery
    FROM enriched_deals
    WHERE deal_date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY symbol, company_name
    ORDER BY deal_count DESC
    LIMIT $1
  `;
  
  try {
    const result = await pool.query(query, [limit]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching active symbols:', error.message);
    throw error;
  }
}

// ========================================
// DATA FETCH LOG
// ========================================

/**
 * Log data fetch operation
 */
export async function logFetch(dataType, exchange, status, recordsCount, errorMsg = null) {
  const query = `
    INSERT INTO data_fetch_log (
      fetch_date, data_type, exchange, status, records_fetched, error_message
    ) VALUES (CURRENT_DATE, $1, $2, $3, $4, $5)
    ON CONFLICT (fetch_date, data_type, exchange)
    DO UPDATE SET
      status = EXCLUDED.status,
      records_fetched = EXCLUDED.records_fetched,
      error_message = EXCLUDED.error_message,
      fetch_timestamp = NOW()
  `;
  
  try {
    await pool.query(query, [dataType, exchange, status, recordsCount, errorMsg]);
  } catch (error) {
    console.error('Error logging fetch:', error.message);
  }
}

/**
 * Get recent fetch logs
 */
export async function getFetchLogs(days = 7) {
  const query = `
    SELECT * FROM data_fetch_log
    WHERE fetch_date >= CURRENT_DATE - INTERVAL '${days} days'
    ORDER BY fetch_timestamp DESC
    LIMIT 50
  `;
  
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching logs:', error.message);
    throw error;
  }
}