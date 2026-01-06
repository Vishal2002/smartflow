import { useState, useEffect, useCallback } from 'react';
import statsService from '../services/stats.service';
import type{ Stats, TopClient, ActiveSymbol } from '../types/stats.type';

export const useStats = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [activeSymbols, setActiveSymbols] = useState<ActiveSymbol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await statsService.getStats();
      setStats(data.stats);
      setTopClients(data.topClients || []);
      setActiveSymbols(data.activeSymbols || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refetch = () => {
    fetchStats();
  };

  return {
    stats,
    topClients,
    activeSymbols,
    loading,
    error,
    refetch,
  };
};