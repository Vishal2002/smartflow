import type { Deal } from "./deals.type";
import type { Stats, TopClient, ActiveSymbol } from "./stats.type";
import type { AccumulationPattern } from "./deals.type";
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
  }
  
  export interface DealsResponse {
    success: boolean;
    count: number;
    deals: Deal[];
  }
  
  export interface StatsResponse {
    success: boolean;
    stats: Stats;
    topClients: TopClient[];
    activeSymbols: ActiveSymbol[];
  }
  
  export interface AccumulationResponse {
    success: boolean;
    count: number;
    accumulationPatterns: AccumulationPattern[];
  }