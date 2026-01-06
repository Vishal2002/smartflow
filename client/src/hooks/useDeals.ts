import { useState, useEffect, useCallback } from 'react';
import dealsService from '../services/deals.service';
import type { Deal, DealFilters } from '../types/deals.type';

export const useDeals = (initialFilters?: DealFilters) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DealFilters>(
    initialFilters || {
      exchange: 'ALL',
      dealType: 'ALL',
      minDelivery: 0,
      search: '',
    }
  );

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dealsService.getDeals(filters);
      setDeals(data);
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
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters({
      exchange: 'ALL',
      dealType: 'ALL',
      minDelivery: 0,
      search: '',
    });
  };

  const refetch = () => {
    fetchDeals();
  };

  return {
    deals,
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
    refetch,
  };
};