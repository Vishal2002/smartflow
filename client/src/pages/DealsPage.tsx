import React, { useState } from 'react';
import { useDeals } from '@/hooks/useDeals';
import { LoadingSpinner } from '@/components/common/loader';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { DealFilters } from '@/components/deals/DealFilters';
import { DealsTable } from '@/components/deals/DealsTable';
import { DealDetailModal } from '@/components/deals/DealModal';
import type{ Deal } from '@/types/deals.type';

export const DealsPage: React.FC = () => {
  const { deals, loading, error, filters, updateFilters, resetFilters, refetch } = useDeals();
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const handleApplyFilters = () => {
    refetch();
  };

  const handleResetFilters = () => {
    resetFilters();
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <DealFilters
        filters={filters}
        onFilterChange={updateFilters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {/* Deals Table */}
      {loading && <LoadingSpinner message="Loading deals..." />}
      {error && <ErrorMessage message={error} />}
      {!loading && !error && (
        <DealsTable
          deals={deals}
          onViewDetails={setSelectedDeal}
          onRefresh={refetch}
        />
      )}

      {/* Deal Detail Modal */}
      <DealDetailModal
        deal={selectedDeal}
        open={!!selectedDeal}
        onClose={() => setSelectedDeal(null)}
      />
    </div>
  );
};