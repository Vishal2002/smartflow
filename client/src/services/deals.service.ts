import apiService from './api.service';
import type { Deal, DealFilters, PaginatedResponse, BuySignal } from '../types/deals.type';

class DealsService {
  /**
   * Get deals with pagination - DEFAULT TO BUY ONLY
   */
  async getDeals(filters: DealFilters): Promise<PaginatedResponse<Deal>> {
    try {
      const params: any = {
        page: filters.page || 1,
        pageSize: filters.pageSize || 20,
        action: filters.action || 'BUY', // DEFAULT: Show only BUYS
      };
      
      if (filters.exchange && filters.exchange !== 'ALL') params.exchange = filters.exchange;
      if (filters.dealType && filters.dealType !== 'ALL') params.dealType = filters.dealType;
      if (filters.minDelivery > 0) params.minDelivery = filters.minDelivery;
      if (filters.minDealValue > 0) params.minDealValue = filters.minDealValue;
      if (filters.search) params.search = filters.search;
      if (filters.onlyAccumulation) params.onlyAccumulation = true;
      if (filters.minConsecutiveBuys > 0) params.minConsecutiveBuys = filters.minConsecutiveBuys;
      if (filters.holdingType?.length) params.holdingType = filters.holdingType.join(',');
      
      // Default to last 2 months
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
      params.startDate = filters.startDate || twoMonthsAgo.toISOString().split('T')[0];
      params.endDate = filters.endDate || new Date().toISOString().split('T')[0];

      const response = await apiService.get<PaginatedResponse<Deal>>('/deals', params);
      return response.data;
    } catch (error) {
      console.error('Error fetching deals:', error);
      throw error;
    }
  }

  /**
   * 💰 GET ACTIONABLE BUY SIGNALS - THE MONEY MAKER
   */
  async getBuySignals(filters?: {
    minSignalStrength?: number;
    signalType?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<BuySignal>> {
    try {
      const params = {
        minSignalStrength: filters?.minSignalStrength || 70, // Only strong signals
        signalType: filters?.signalType || 'ALL',
        page: filters?.page || 1,
        pageSize: filters?.pageSize || 10,
      };

      const response = await apiService.get<PaginatedResponse<BuySignal>>(
        '/signals/buy',
        params
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching buy signals:', error);
      throw error;
    }
  }

  /**
   * Get smart money moves - Only significant institutional buying
   */
  async getSmartMoneyMoves(days = 60, minValue = 10000000): Promise<Deal[]> {
    try {
      const response = await apiService.get<{ deals: Deal[] }>('/deals/smart-money', {
        days,
        minValue,
        action: 'BUY',
      });
      return response.data.deals || [];
    } catch (error) {
      console.error('Error fetching smart money moves:', error);
      throw error;
    }
  }
}

export default new DealsService();