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
    action: 'ALL',                    // Changed default – more likely to show data
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

      // Ensure we always have an array
      const rawDeals = Array.isArray(response.data) ? response.data : [];

      // ────────────────────────────────────────────────
      // CRITICAL: Convert string numbers → real numbers
      // This fixes the main problem why table shows mostly dashes
      // ────────────────────────────────────────────────
      //@ts-ignore
      const normalizedDeals: Deal[] = rawDeals.map((deal) => ({
        ...deal,

        // Core numeric fields that formatters expect to be numbers
        quantity: deal.quantity != null ? Number(deal.quantity) : null,
        price: deal.price != null ? Number(deal.price) : null,
        deal_value: deal.deal_value != null ? Number(deal.deal_value) : null,

        // Percentages & scores
        delivery_percent: deal.delivery_percent != null ? Number(deal.delivery_percent) : null,
        confidence_score: deal.confidence_score != null ? Number(deal.confidence_score) : null,

        // Optional counters
        total_buy_deals: deal.total_buy_deals != null ? Number(deal.total_buy_deals) : null,
        consecutive_buys: deal.consecutive_buys != null ? Number(deal.consecutive_buys) : null,

        // Keep dates & strings as-is
        deal_date: deal.deal_date,
        symbol: deal.symbol,
        company_name: deal.company_name,
        client_name: deal.client_name,
        action: deal.action,
        exchange: deal.exchange,
        deal_type: deal.deal_type,
        holding_type: deal.holding_type,
        is_accumulating: deal.is_accumulating,
        avg_holding_days: deal.avg_holding_days,
        traded_quantity: deal.traded_quantity != null ? Number(deal.traded_quantity) : null,
        delivered_quantity: deal.delivered_quantity != null ? Number(deal.delivered_quantity) : null,
      }));

      // Debug output – helps confirm the fix is working
      if (normalizedDeals.length > 0) {
        console.log('[useDeals] First deal after normalization:', {
          symbol: normalizedDeals[0].symbol,
          deal_value: normalizedDeals[0].deal_value,
          quantity: normalizedDeals[0].quantity,
          delivery_percent: normalizedDeals[0].delivery_percent,
          typeof_deal_value: typeof normalizedDeals[0].deal_value,   // should be "number"
          deal_value_raw: rawDeals[0].deal_value,                    // should be string
        });
      } else {
        console.log('[useDeals] No deals received from API');
      }

      setDeals(normalizedDeals);

      // Safe pagination fallback
      setPagination(
        response.pagination ?? {
          currentPage: filters.page,
          pageSize: filters.pageSize,
          totalRecords: normalizedDeals.length,
          totalPages: Math.max(1, Math.ceil(normalizedDeals.length / filters.pageSize)),
          hasNext: false,
          hasPrev: false,
        }
      );
    } catch (err: any) {
      console.error('[useDeals] Fetch error:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to load deals – check if the backend is running'
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const updateFilters = (newFilters: Partial<DealFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      exchange: 'ALL',
      dealType: 'ALL',
      minDelivery: 0,
      search: '',
      action: 'ALL',
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