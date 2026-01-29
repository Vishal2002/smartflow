import React, { useState } from 'react';
import { useDeals } from '@/hooks/useDeals';
import { LoadingSpinner } from '@/components/common/loader';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Pagination } from '@/components/common/Pagination';
import { EnhancedDealFilters } from '@/components/deals/EnhancedDealFilters';
import { DealsTable } from '@/components/deals/DealsTable';
import { DealDetailModal } from '@/components/deals/DealDetailModal';
import type { Deal } from '@/types/deals.type';
import { RefreshCw, AlertTriangle } from 'lucide-react';

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

  // Debug helper - remove in production if you want
  React.useEffect(() => {
    console.log('[DealsPage] Current state:', {
      dealsCount: deals?.length ?? 0,
      loading,
      error,
      paginationTotal: pagination.totalRecords,
    });
  }, [deals, loading, error, pagination]);

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <EnhancedDealFilters
        filters={filters}
        onFilterChange={updateFilters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {/* Main Content Area */}
      <div className="min-h-[400px] relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <LoadingSpinner message="Loading deals..." />
          </div>
        )}

        {error && (
          <div className="p-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
            <ErrorMessage message={error} />
            <button
              onClick={refetch}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* No results state */}
            {deals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed rounded-lg bg-muted/40">
                <AlertTriangle className="h-10 w-10 text-amber-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">No deals found</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  No deals match your current filters. Try one of these:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside mb-6 space-y-1">
                  <li>Set Action to "All" or "SELL"</li>
                  <li>Lower or remove Min Deal Value</li>
                  <li>Widen the date range</li>
                  <li>Clear the search term</li>
                </ul>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <>
                {/* Table with safe fallback */}
                <DealsTable
                  deals={deals}
                  onViewDetails={setSelectedDeal}
                  onRefresh={refetch}
                />

                {/* Pagination - only show when there's actual data */}
                {pagination.totalPages > 1 && pagination.totalRecords > 0 && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={pagination.currentPage}
                      totalPages={pagination.totalPages}
                      pageSize={pagination.pageSize}
                      totalRecords={pagination.totalRecords}
                      onPageChange={goToPage}
                      onPageSizeChange={changePageSize}
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      <DealDetailModal
        deal={selectedDeal}
        open={!!selectedDeal}
        onClose={() => setSelectedDeal(null)}
      />
    </div>
  );
};