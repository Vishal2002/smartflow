import React, { useState } from 'react';
import { useDeals } from '@/hooks/useDeals';
import { LoadingSpinner } from '@/components/common/loader';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Pagination } from '@/components/common/Pagination';
import { EnhancedDealFilters } from '@/components/deals/EnhancedDealFilters';
import { DealsTable } from '@/components/deals/DealsTable';
import { DealDetailModal } from '@/components/deals/DealDetailModal';
import type { Deal } from '@/types/deals.type';

export const DealsPage: React.FC = () => {
  const {
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
  } = useDeals();
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const handleApplyFilters = () => {
    refetch();
  };

  const handleResetFilters = () => {
    resetFilters();
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Filters */}
      <EnhancedDealFilters
        filters={filters}
        onFilterChange={updateFilters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {/* Deals Table */}
      {loading && <LoadingSpinner message="Loading deals..." />}
      {error && <ErrorMessage message={error} />}
      {!loading && !error && (
        <>
          <DealsTable deals={deals} onViewDetails={setSelectedDeal} onRefresh={refetch} />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              pageSize={pagination.pageSize}
              totalRecords={pagination.totalRecords}
              onPageChange={goToPage}
              onPageSizeChange={changePageSize}
            />
          )}
        </>
      )}

      {/* Deal Detail Modal */}
      <DealDetailModal deal={selectedDeal} open={!!selectedDeal} onClose={() => setSelectedDeal(null)} />
    </div>
  );
};