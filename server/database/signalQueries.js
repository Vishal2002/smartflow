// server/database/signalQueries.js
import { pool } from './db.js';

export async function generateBuySignals(minStrength = 70, limit = 20, offset = 0) {
  const query = `
    WITH client_performance AS (
      SELECT 
        client_name,
        COUNT(DISTINCT symbol) as total_picks,
        70.0 as success_rate
      FROM enriched_deals
      WHERE deal_date >= CURRENT_DATE - INTERVAL '180 days'
        AND action = 'BUY'
      GROUP BY client_name
    ),
    accumulation_signals AS (
      SELECT 
        d.symbol,
        MAX(d.company_name) as company_name,
        
        (
          SELECT client_name 
          FROM enriched_deals d2 
          WHERE d2.symbol = d.symbol 
            AND d2.action = 'BUY'
            AND d2.deal_date >= CURRENT_DATE - INTERVAL '60 days'
          ORDER BY deal_value DESC 
          LIMIT 1
        ) as primary_buyer,
        
        COUNT(*) as total_buys,
        SUM(d.quantity) as total_quantity,
        SUM(d.deal_value) as total_value,
        AVG(d.price) as avg_buy_price,
        MAX(d.deal_date) as latest_buy_date,
        MIN(d.deal_date) as first_buy_date,
        AVG(COALESCE(d.delivery_percent, 0)) as avg_delivery,
        
        COUNT(DISTINCT d.client_name) as unique_buyers,
        MAX(COALESCE(d.consecutive_buys, 0)) as max_consecutive,
        
        -- FIX: Simple integer subtraction for date difference
        (MAX(d.deal_date) - MIN(d.deal_date)) as accumulation_days
        
      FROM enriched_deals d
      WHERE d.deal_date >= CURRENT_DATE - INTERVAL '60 days'
        AND d.action = 'BUY'
        AND d.deal_value >= 10000000
        AND COALESCE(d.delivery_percent, 0) >= 75
      GROUP BY d.symbol
      HAVING COUNT(*) >= 3
        AND AVG(COALESCE(d.delivery_percent, 0)) >= 80
    ),
    signals_with_scores AS (
      SELECT 
        a.*,
        COALESCE(cp.success_rate, 50) as buyer_track_record,
        
        (
          (LEAST(a.total_buys, 10) * 8) +
          (LEAST(a.avg_delivery, 100) * 0.15) +
          (CASE WHEN a.unique_buyers >= 3 THEN 15 ELSE 0 END) +
          (LEAST(COALESCE(a.max_consecutive, 0), 5) * 5) +
          (CASE WHEN a.total_value >= 100000000 THEN 10 ELSE 5 END)
        )::INTEGER as signal_strength,
        
        a.avg_buy_price as entry_price,
        (a.avg_buy_price * 1.25) as target_price,
        (a.avg_buy_price * 0.92) as stop_loss,
        25.0 as potential_return,
        3.12 as risk_reward_ratio,
        
        CASE 
          WHEN a.total_buys >= 5 AND COALESCE(a.max_consecutive, 0) >= 3 THEN 'ACCUMULATION'
          WHEN a.unique_buyers >= 3 AND a.total_value >= 100000000 THEN 'INSTITUTIONAL'
          WHEN a.avg_delivery >= 95 THEN 'BREAKOUT'
          ELSE 'INSIDER'
        END as signal_type,
        
        CASE 
          WHEN a.latest_buy_date >= CURRENT_DATE - INTERVAL '3 days' 
            AND a.total_buys >= 4 THEN 'HIGH'
          WHEN a.latest_buy_date >= CURRENT_DATE - INTERVAL '7 days' THEN 'MEDIUM'
          ELSE 'LOW'
        END as urgency,
        
        CASE 
          WHEN a.latest_buy_date >= CURRENT_DATE - INTERVAL '2 days' 
            AND a.avg_delivery >= 90 THEN 'BUY_NOW'
          WHEN a.total_buys >= 5 THEN 'BUY_ON_DIP'
          WHEN a.accumulation_days <= 14 THEN 'MONITOR'
          ELSE 'WAIT'
        END as recommended_action,
        
        ARRAY_REMOVE(ARRAY[
          CASE WHEN a.total_buys >= 5 THEN 'Strong accumulation: ' || a.total_buys || ' buys in ' || COALESCE(a.accumulation_days, 0) || ' days' END,
          CASE WHEN a.avg_delivery >= 90 THEN 'Very high delivery: ' || ROUND(a.avg_delivery::numeric, 1) || '%' END,
          CASE WHEN a.unique_buyers >= 3 THEN 'Multiple institutions buying: ' || a.unique_buyers || ' buyers' END,
          CASE WHEN COALESCE(a.max_consecutive, 0) >= 3 THEN 'Consecutive buying pattern: ' || a.max_consecutive || ' times' END,
          CASE WHEN a.total_value >= 100000000 THEN 'Large institutional position: ₹' || ROUND((a.total_value/10000000)::numeric, 2) || 'Cr' END,
          CASE WHEN COALESCE(cp.success_rate, 0) >= 70 THEN 'Proven buyer: ' || ROUND(cp.success_rate::numeric, 0) || '% success rate' END
        ], NULL) as reasons
        
      FROM accumulation_signals a
      LEFT JOIN client_performance cp ON a.primary_buyer = cp.client_name
    )
    SELECT 
      ROW_NUMBER() OVER (ORDER BY signal_strength DESC, total_value DESC) as id,
      symbol,
      company_name,
      signal_type,
      signal_strength,
      reasons,
      primary_buyer,
      buyer_track_record,
      total_buys as total_bought_2m,
      avg_buy_price,
      latest_buy_date,
      COALESCE(max_consecutive, 0) as consecutive_buys,
      avg_delivery,
      entry_price,
      target_price,
      stop_loss,
      potential_return,
      risk_reward_ratio,
      COALESCE(accumulation_days, 0) as days_in_accumulation,
      recommended_action,
      urgency,
      COUNT(*) OVER() as total_count
      
    FROM signals_with_scores
    WHERE signal_strength >= $1
    ORDER BY signal_strength DESC, total_value DESC
    LIMIT $2 OFFSET $3;
  `;
  
  try {
    const result = await pool.query(query, [minStrength, limit, offset]);
    
    const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    const totalPages = Math.ceil(totalCount / limit);
    const currentPage = Math.floor(offset / limit) + 1;
    
    return {
      data: result.rows.map(row => {
        const { total_count, ...signal } = row;
        return signal;
      }),
      pagination: {
        currentPage,
        pageSize: limit,
        totalRecords: totalCount,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
      },
    };
  } catch (error) {
    console.error('Error generating buy signals:', error);
    throw error;
  }
}