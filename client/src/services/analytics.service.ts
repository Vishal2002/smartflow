import apiService from './api.service';
import type { TopClient, ActiveSymbol } from '../types/stats.type';
import type { AccumulationResponse } from '../types/api.types';
import type { AccumulationPattern } from '../types/deals.type';

class AnalyticsService {
  async getAccumulationPatterns(minDeals = 3): Promise<AccumulationPattern[]> {
    try {
      const response = await apiService.get<AccumulationResponse>('/analytics/accumulation', { minDeals });
      return response.data.accumulationPatterns || [];
    } catch (error) {
      console.error('Error fetching accumulation patterns:', error);
      throw error;
    }
  }

  async getTopClients(limit = 10): Promise<TopClient[]> {
    try {
      const response = await apiService.get<{ success: boolean; topClients: TopClient[] }>(
        '/analytics/top-clients',
        { limit }
      );
      return response.data.topClients || [];
    } catch (error) {
      console.error('Error fetching top clients:', error);
      throw error;
    }
  }

  async getActiveSymbols(limit = 10): Promise<ActiveSymbol[]> {
    try {
      const response = await apiService.get<{ success: boolean; activeSymbols: ActiveSymbol[] }>(
        '/analytics/active-symbols',
        { limit }
      );
      return response.data.activeSymbols || [];
    } catch (error) {
      console.error('Error fetching active symbols:', error);
      throw error;
    }
  }
}

export default new AnalyticsService();