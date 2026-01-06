import { useState, useEffect, useCallback } from 'react';
import analyticsService from '../services/analytics.service';
import type{ AccumulationPattern } from '../types/deals.type';

export const useAccumulation = (minDeals = 3) => {
  const [patterns, setPatterns] = useState<AccumulationPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatterns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyticsService.getAccumulationPatterns(minDeals);
      setPatterns(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch accumulation patterns');
    } finally {
      setLoading(false);
    }
  }, [minDeals]);

  useEffect(() => {
    fetchPatterns();
  }, [fetchPatterns]);

  const refetch = () => {
    fetchPatterns();
  };

  return {
    patterns,
    loading,
    error,
    refetch,
  };
};
