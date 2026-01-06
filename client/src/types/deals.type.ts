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
    limit?: number;
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