import apiService from './api.service';
import type { Deal, DealFilters } from '../types/deals.type';

class DealsService {
  async getDeals(filters?: DealFilters): Promise<Deal[]> {
    try {
      const params: any = {};
      
      if (filters) {
        if (filters.exchange && filters.exchange !== 'ALL') params.exchange = filters.exchange;
        if (filters.dealType && filters.dealType !== 'ALL') params.dealType = filters.dealType;
        if (filters.minDelivery > 0) params.minDelivery = filters.minDelivery;
        if (filters.search) params.search = filters.search;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;
        params.limit = filters.limit || 50;
      }

      const response = await apiService.get<any>('/deals', params);
      return response.data.deals || [];
    } catch (error) {
      console.error('Error fetching deals:', error);
      throw error;
    }
  }

  async getDealsBySymbol(symbol: string, limit = 50): Promise<Deal[]> {
    try {
      const response = await apiService.get<any>(`/deals/${symbol}`, { limit });
      return response.data.deals || [];
    } catch (error) {
      console.error(`Error fetching deals for ${symbol}:`, error);
      throw error;
    }
  }

  async createDeal(dealData: Partial<Deal>): Promise<{ dealId: number }> {
    try {
      const response = await apiService.post<{ dealId: number }>('/deals', dealData);
      return response.data;
    } catch (error) {
      console.error('Error creating deal:', error);
      throw error;
    }
  }
}

export default new DealsService();