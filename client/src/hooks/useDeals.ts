import { useState, useEffect, useCallback } from 'react';
import dealsService from '../services/deals.service';
import type { Deal, DealFilters, PaginatedResponse } from '../types/deals.type';

export const useDeals = (initialFilters?: Partial<DealFilters>) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DealFilters>({
    exchange: 'ALL',
    dealType: 'ALL',
    minDelivery: 0,
    search: '',
    action: 'BUY', // DEFAULT: Show only BUYS
    minDealValue: 0,
    onlyAccumulation: false,
    minConsecutiveBuys: 0,
    page: 1,
    pageSize: 20,
    ...initialFilters,
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 20,
    totalRecords: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<Deal> = await dealsService.getDeals(filters);
      setDeals(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch deals');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const updateFilters = (newFilters: Partial<DealFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 })); // Reset to page 1 on filter change
  };

  const resetFilters = () => {
    setFilters({
      exchange: 'ALL',
      dealType: 'ALL',
      minDelivery: 0,
      search: '',
      action: 'BUY',
      minDealValue: 0,
      onlyAccumulation: false,
      minConsecutiveBuys: 0,
      page: 1,
      pageSize: 20,
    });
  };

  const goToPage = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const changePageSize = (pageSize: number) => {
    setFilters((prev) => ({ ...prev, pageSize, page: 1 }));
  };

  const refetch = () => {
    fetchDeals();
  };

  return {
    deals,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    resetFilters,
    goToPage,
    changePageSize,
    refetch,
  };
};