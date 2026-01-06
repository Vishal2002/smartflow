import { useState, useCallback } from 'react';
import dealsService from '../services/deals.service';
import type { Deal } from '../types/deals.type';

export const useSymbolDeals = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSymbolDeals = useCallback(async (symbol: string, limit = 50) => {
    setLoading(true);
    setError(null);
    try {
      const data = await dealsService.getDealsBySymbol(symbol, limit);
      setDeals(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch symbol deals');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    deals,
    loading,
    error,
    fetchSymbolDeals,
  };
};