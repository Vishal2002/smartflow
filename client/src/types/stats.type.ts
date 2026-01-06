export interface Stats {
    total_deals: number;
    today_deals: number;
    strong_longterm: number;
    accumulation_patterns: number;
    avg_delivery_percent: number;
  }
  
  export interface TopClient {
    client_name: string;
    total_deals: number;
    total_value: number;
    avg_delivery: number;
  }
  
  export interface ActiveSymbol {
    symbol: string;
    company_name: string;
    deal_count: number;
    total_value: number;
    avg_delivery: number;
  }