import { useState, useEffect, useCallback } from 'react';
import dealsService from '../services/deals.service';
import type { BuySignal, PaginatedResponse } from '../types/deals.type';

export const useBuySignals = (minStrength = 70) => {
  const [signals, setSignals] = useState<BuySignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalRecords: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<BuySignal> = await dealsService.getBuySignals({
        minSignalStrength: minStrength,
        page,
        pageSize,
      });
      
      setSignals(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch buy signals');
    } finally {
      setLoading(false);
    }
  }, [minStrength, page, pageSize]);

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  const goToPage = (newPage: number) => {
    setPage(newPage);
  };

  const changePageSize = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  };

  const refetch = () => {
    fetchSignals();
  };

  return {
    signals,
    loading,
    error,
    pagination,
    goToPage,
    changePageSize,
    refetch,
  };
};