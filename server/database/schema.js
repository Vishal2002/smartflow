// ============================================
// DATABASE SCHEMA SETUP - schema.js
// Creates all tables for SmartFlow
// ============================================

import { pool } from './db.js';

export async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database setup...');
    await client.query('BEGIN');
    
    // ========================================
    // TABLE 1: DEALS
    // Stores all block and bulk deals
    // ========================================
    console.log('📊 Creating deals table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS deals (
        id SERIAL PRIMARY KEY,
        deal_date DATE NOT NULL,
        exchange VARCHAR(10) NOT NULL CHECK (exchange IN ('NSE', 'BSE')),
        deal_type VARCHAR(10) NOT NULL CHECK (deal_type IN ('BLOCK', 'BULK')),
        symbol VARCHAR(50) NOT NULL,
        company_name VARCHAR(255),
        client_name VARCHAR(255) NOT NULL,
        action VARCHAR(10) NOT NULL CHECK (action IN ('BUY', 'SELL')),
        quantity BIGINT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        deal_value DECIMAL(15, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // ========================================
    // TABLE 2: DELIVERY_DATA
    // Stores delivery percentages (KEY METRIC!)
    // ========================================
    console.log('📦 Creating delivery_data table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS delivery_data (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(50) NOT NULL,
        trade_date DATE NOT NULL,
        exchange VARCHAR(10) NOT NULL CHECK (exchange IN ('NSE', 'BSE')),
        traded_quantity BIGINT NOT NULL,
        delivered_quantity BIGINT NOT NULL,
        delivery_percent DECIMAL(5, 2) NOT NULL,
        total_trades INTEGER,
        turnover DECIMAL(15, 2),
        created_at TIMESTAMP DEFAULT NOW(),
        
        UNIQUE(symbol, trade_date, exchange)
      );
    `);
    
    // ========================================
    // TABLE 3: CLIENT_PATTERNS
    // Tracks accumulation patterns
    // ========================================
    console.log('👥 Creating client_patterns table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS client_patterns (
        id SERIAL PRIMARY KEY,
        client_name VARCHAR(255) NOT NULL,
        symbol VARCHAR(50) NOT NULL,
        total_buy_deals INTEGER DEFAULT 0,
        total_sell_deals INTEGER DEFAULT 0,
        total_buy_quantity BIGINT DEFAULT 0,
        total_buy_value DECIMAL(15, 2) DEFAULT 0,
        first_buy_date DATE,
        last_buy_date DATE,
        avg_holding_days INTEGER,
        is_accumulating BOOLEAN DEFAULT FALSE,
        consecutive_buys INTEGER DEFAULT 0,
        avg_delivery_percent DECIMAL(5, 2),
        last_updated TIMESTAMP DEFAULT NOW(),
        
        UNIQUE(client_name, symbol)
      );
    `);
    
    // ========================================
    // TABLE 4: DATA_FETCH_LOG
    // Tracks when data was fetched
    // ========================================
    console.log('📝 Creating data_fetch_log table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS data_fetch_log (
        id SERIAL PRIMARY KEY,
        fetch_date DATE NOT NULL,
        data_type VARCHAR(50) NOT NULL,
        exchange VARCHAR(10) NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'PARTIAL')),
        records_fetched INTEGER DEFAULT 0,
        error_message TEXT,
        fetch_timestamp TIMESTAMP DEFAULT NOW(),
        
        UNIQUE(fetch_date, data_type, exchange)
      );
    `);
    
    // ========================================
    // INDEXES FOR PERFORMANCE
    // ========================================
    console.log('⚡ Creating indexes...');
    
    // Deals indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_deals_date ON deals(deal_date DESC);
      CREATE INDEX IF NOT EXISTS idx_deals_symbol ON deals(symbol);
      CREATE INDEX IF NOT EXISTS idx_deals_client ON deals(client_name);
      CREATE INDEX IF NOT EXISTS idx_deals_exchange ON deals(exchange);
      CREATE INDEX IF NOT EXISTS idx_deals_type ON deals(deal_type);
    `);
    
    // Delivery data indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_delivery_symbol_date ON delivery_data(symbol, trade_date DESC);
      CREATE INDEX IF NOT EXISTS idx_delivery_percent ON delivery_data(delivery_percent DESC);
      CREATE INDEX IF NOT EXISTS idx_delivery_date ON delivery_data(trade_date DESC);
    `);
    
    // Client patterns indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_client_patterns_client ON client_patterns(client_name);
      CREATE INDEX IF NOT EXISTS idx_client_patterns_symbol ON client_patterns(symbol);
      CREATE INDEX IF NOT EXISTS idx_client_patterns_accumulating ON client_patterns(is_accumulating) 
        WHERE is_accumulating = TRUE;
    `);
    
    // ========================================
    // VIEW: ENRICHED_DEALS
    // Combines all data for easy querying
    // ========================================
    console.log('🔍 Creating enriched_deals view...');
    await client.query(`
      CREATE OR REPLACE VIEW enriched_deals AS
      SELECT 
        d.id,
        d.deal_date,
        d.exchange,
        d.deal_type,
        d.symbol,
        d.company_name,
        d.client_name,
        d.action,
        d.quantity,
        d.price,
        d.deal_value,
        
        -- Delivery data
        COALESCE(dd.delivery_percent, 0) as delivery_percent,
        dd.traded_quantity,
        dd.delivered_quantity,
        
        -- Client pattern data
        cp.total_buy_deals,
        cp.avg_holding_days,
        cp.is_accumulating,
        cp.consecutive_buys,
        
        -- Classification based on delivery % and holding days
        CASE 
          WHEN dd.delivery_percent >= 90 AND cp.avg_holding_days >= 30 THEN 'STRONG_LONGTERM'
          WHEN dd.delivery_percent >= 80 AND cp.avg_holding_days >= 15 THEN 'MODERATE_LONGTERM'
          WHEN dd.delivery_percent >= 70 THEN 'SHORTTERM_POTENTIAL'
          ELSE 'SPECULATION'
        END as holding_type,
        
        -- Confidence score (0-100)
        (
          (COALESCE(dd.delivery_percent, 0) * 0.4) +
          (LEAST(COALESCE(cp.avg_holding_days, 0), 100) * 0.3) +
          (CASE WHEN d.deal_value > 50000000 THEN 20 ELSE 10 END) +
          (CASE WHEN cp.is_accumulating THEN 10 ELSE 0 END)
        ) as confidence_score
        
      FROM deals d
      LEFT JOIN delivery_data dd 
        ON d.symbol = dd.symbol 
        AND d.deal_date = dd.trade_date 
        AND d.exchange = dd.exchange
      LEFT JOIN client_patterns cp 
        ON d.client_name = cp.client_name 
        AND d.symbol = cp.symbol
      ORDER BY d.deal_date DESC, d.deal_value DESC;
    `);
    
    // ========================================
    // TRIGGER: Auto-update updated_at
    // ========================================
    console.log('⚙️ Creating triggers...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS update_deals_updated_at ON deals;
      CREATE TRIGGER update_deals_updated_at
        BEFORE UPDATE ON deals
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    
    // ========================================
    // INSERT SAMPLE DATA (for testing)
    // ========================================
    console.log('📝 Inserting sample data...');
    
    await client.query(`
      INSERT INTO deals (
        deal_date, exchange, deal_type, symbol, company_name, 
        client_name, action, quantity, price, deal_value
      ) VALUES
        ('2026-01-03', 'NSE', 'BULK', 'RELIANCE', 'Reliance Industries Ltd', 
         'HDFC Mutual Fund', 'BUY', 1250000, 2845.50, 355687500),
        ('2026-01-03', 'BSE', 'BLOCK', 'TCS', 'Tata Consultancy Services', 
         'LIC of India', 'BUY', 2500000, 3920.00, 980000000),
        ('2026-01-03', 'NSE', 'BULK', 'INFY', 'Infosys Limited', 
         'Goldman Sachs', 'SELL', 800000, 1542.25, 123380000),
        ('2026-01-03', 'NSE', 'BLOCK', 'HDFCBANK', 'HDFC Bank Ltd', 
         'SBI Mutual Fund', 'BUY', 1800000, 1685.75, 303435000),
        ('2026-01-03', 'BSE', 'BULK', 'ITC', 'ITC Limited', 
         'Morgan Stanley', 'BUY', 3200000, 458.30, 146656000)
      ON CONFLICT DO NOTHING;
    `);
    
    await client.query(`
      INSERT INTO delivery_data (
        symbol, trade_date, exchange, traded_quantity, 
        delivered_quantity, delivery_percent
      ) VALUES
        ('RELIANCE', '2026-01-03', 'NSE', 5000000, 4925000, 98.5),
        ('TCS', '2026-01-03', 'BSE', 3000000, 3000000, 100.0),
        ('INFY', '2026-01-03', 'NSE', 4000000, 2608000, 65.2),
        ('HDFCBANK', '2026-01-03', 'NSE', 6000000, 5748000, 95.8),
        ('ITC', '2026-01-03', 'BSE', 8000000, 7384000, 92.3)
      ON CONFLICT DO NOTHING;
    `);
    
    await client.query(`
      INSERT INTO client_patterns (
        client_name, symbol, total_buy_deals, total_buy_quantity, 
        total_buy_value, first_buy_date, last_buy_date, 
        avg_holding_days, is_accumulating, consecutive_buys, avg_delivery_percent
      ) VALUES
        ('HDFC Mutual Fund', 'RELIANCE', 5, 5000000, 1400000000, 
         '2025-11-15', '2026-01-03', 45, TRUE, 3, 96.5),
        ('LIC of India', 'TCS', 8, 15000000, 5500000000, 
         '2025-08-20', '2026-01-03', 120, TRUE, 5, 98.2),
        ('SBI Mutual Fund', 'HDFCBANK', 4, 6000000, 950000000, 
         '2025-10-10', '2026-01-03', 67, TRUE, 4, 94.3),
        ('Morgan Stanley', 'ITC', 3, 8000000, 1200000000, 
         '2025-10-25', '2026-01-03', 89, TRUE, 3, 92.1)
      ON CONFLICT DO NOTHING;
    `);
    
    await client.query('COMMIT');
    console.log('✅ Database schema setup complete with sample data!');
    console.log('📊 Tables created: deals, delivery_data, client_patterns, data_fetch_log');
    console.log('🔍 View created: enriched_deals');
    console.log('📝 Sample data inserted for testing');
    
    return true;
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Function to drop all tables (for resetting)
export async function dropAllTables() {
  const client = await pool.connect();
  
  try {
    console.log('🗑️ Dropping all tables...');
    await client.query('BEGIN');
    
    await client.query(`
      DROP VIEW IF EXISTS enriched_deals CASCADE;
      DROP TABLE IF EXISTS data_fetch_log CASCADE;
      DROP TABLE IF EXISTS client_patterns CASCADE;
      DROP TABLE IF EXISTS delivery_data CASCADE;
      DROP TABLE IF EXISTS deals CASCADE;
      DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
    `);
    
    await client.query('COMMIT');
    console.log('✅ All tables dropped successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to drop tables:', error);
    throw error;
  } finally {
    client.release();
  }
}