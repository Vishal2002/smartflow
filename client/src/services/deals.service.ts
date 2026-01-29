// src/services/deals.service.ts
import apiService from './api.service';
import type { Deal, DealFilters, PaginatedResponse,BuySignal } from '../types/deals.type';

class DealsService {
  async getDeals(filters: DealFilters): Promise<PaginatedResponse<Deal>> {
    try {
      const params: any = {
        page: filters.page || 1,
        pageSize: filters.pageSize || 20,
      };
      
      // Only add action if not 'ALL'
      if (filters.action && filters.action !== 'ALL') {
        params.action = filters.action;
      }
      
      if (filters.exchange && filters.exchange !== 'ALL') params.exchange = filters.exchange;
      if (filters.dealType && filters.dealType !== 'ALL') params.dealType = filters.dealType;
      if (filters.minDelivery > 0) params.minDelivery = filters.minDelivery;
      if (filters.minDealValue > 0) params.minDealValue = filters.minDealValue;
      if (filters.search) params.search = filters.search;
      if (filters.onlyAccumulation) params.onlyAccumulation = true;
      if (filters.minConsecutiveBuys > 0) params.minConsecutiveBuys = filters.minConsecutiveBuys;
      if (filters.holdingType?.length) params.holdingType = filters.holdingType.join(',');
      
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
      params.startDate = filters.startDate || twoMonthsAgo.toISOString().split('T')[0];
      params.endDate = filters.endDate || new Date().toISOString().split('T')[0];

      console.log('🌐 Calling API with params:', params);
      
      // Your backend returns: { success: true, deals: [...], count: 100 }
      const response = await apiService.get<{
        success: boolean;
        count: number;
        deals: Deal[];
      }>('/deals', params);
      
      console.log('📡 Raw API response:', response.data);
      
      // Transform to PaginatedResponse format
      const deals = response.data.deals || [];
      const totalRecords = response.data.count || deals.length;
      const pageSize = filters.pageSize || 20;
      const currentPage = filters.page || 1;
      const totalPages = Math.ceil(totalRecords / pageSize);
      
      return {
        data: deals,
        pagination: {
          currentPage,
          pageSize,
          totalRecords,
          totalPages,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1,
        },
      };
      
    } catch (error) {
      console.error('❌ Error in dealsService.getDeals:', error);
      throw error;
    }
  }

  /**
   * Get Buy Signals - NOW FIXED to return PaginatedResponse<BuySignal>
   * (same transformation as getDeals)
   */
  async getBuySignals(filters?: {
    minSignalStrength?: number;
    signalType?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<BuySignal>> {
    try {
      const params: any = {
        minSignalStrength: filters?.minSignalStrength || 70,
        signalType: filters?.signalType || 'ALL',
        page: filters?.page || 1,
        pageSize: filters?.pageSize || 10,
      };

      console.log('🌐 Calling /signals/buy with params:', params);

      // Assuming backend returns similar structure: { success: true, count: number, deals: BuySignal[] }
      // If the field is called "signals" instead of "deals" → change to raw.data.signals
      const raw = await apiService.get<{
        success: boolean;
        count: number;
        deals: BuySignal[];          // ← change to "signals" if your endpoint uses that name
      }>('/signals/buy', params);

      console.log('📡 Raw /signals/buy response:', raw.data);

      const items = raw.data.deals || [];   // ← if backend uses "signals": raw.data.signals || []
      const total = raw.data.count || items.length;
      const pageSize = filters?.pageSize || 10;
      const currentPage = filters?.page || 1;
      const totalPages = Math.ceil(total / pageSize);

      return {
        data: items,
        pagination: {
          currentPage,
          pageSize,
          totalRecords: total,
          totalPages,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1,
        },
      };
    } catch (error) {
      console.error('❌ getBuySignals failed:', error);
      throw error;
    }
  }
}

export default new DealsService();