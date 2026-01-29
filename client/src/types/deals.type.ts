export interface Deal {
    id: number;
    deal_date: string;
    exchange: 'NSE' | 'BSE';
    deal_type: 'BLOCK' | 'BULK';
    symbol: string;
    company_name: string;
    client_name: string;
    action: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    deal_value: number;
    delivery_percent?: number;
    traded_quantity?: number;
    delivered_quantity?: number;
    total_buy_deals?: number;
    avg_holding_days?: number;
    is_accumulating?: boolean;
    consecutive_buys?: number;
    holding_type?: 'STRONG_LONGTERM' | 'MODERATE_LONGTERM' | 'SHORTTERM_POTENTIAL' | 'SPECULATION';
    confidence_score?: number;
  }
  
  export interface DealFilters {
    exchange: string;
    dealType: string;
    minDelivery: number;
    search: string;
    startDate?: string;
    endDate?: string;
    action: 'BUY' | 'SELL' | 'ALL';           
    minDealValue: number;                       
    onlyAccumulation: boolean;                 
    minConsecutiveBuys: number;                
    holdingType?: string[];                    
    
    // PAGINATION
    page: number;
    pageSize: number;
  }

  export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
      currentPage: number;
      pageSize: number;
      totalRecords: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }
  
  export interface AccumulationPattern {
    client_name: string;
    symbol: string;
    total_buy_deals: number;
    total_buy_quantity: number;
    total_buy_value: number;
    avg_holding_days: number;
    avg_delivery_percent: number;
    consecutive_buys: number;
    last_buy_date: string;
  }

  export interface BuySignal {
    id: number;
    symbol: string;
    company_name: string;
    signal_type: 'ACCUMULATION' | 'BREAKOUT' | 'INSTITUTIONAL' | 'INSIDER';
    signal_strength: number; // 0-100
    
    // WHY THIS IS A BUY
    reasons: string[];
    
    // CLIENT INFO
    primary_buyer: string;
    buyer_track_record: number; // Past success rate %
    
    // DEAL METRICS
    total_bought_2m: number;      // Last 2 months
    avg_buy_price: number;
    latest_buy_date: string;
    consecutive_buys: number;
    avg_delivery: number;
    
    // PROFIT POTENTIAL
    entry_price: number;          // Recommended entry
    target_price: number;         // Expected target
    stop_loss: number;            // Risk management
    potential_return: number;     // Expected %
    risk_reward_ratio: number;
    
    // TIMING
    days_in_accumulation: number;
    recommended_action: 'BUY_NOW' | 'BUY_ON_DIP' | 'WAIT' | 'MONITOR';
    urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  }
  