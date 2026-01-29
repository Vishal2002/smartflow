import React, { useState } from 'react';
import { useBuySignals } from '@/hooks/useBuySignals';
import { LoadingSpinner } from '@/components/common/loader';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Pagination } from '@/components/common/Pagination';
import { BuySignalsTable } from '@/components/signals/BuySignalsTable';
import { BuySignalDetailModal } from '@/components/signals/BuySignalModal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import type { BuySignal } from '@/types/deals.type';
import { TrendingUp, Target, Zap } from 'lucide-react';

export const BuySignalsPage: React.FC = () => {
  const [minStrength, setMinStrength] = useState(70);
  const { signals, loading, error, pagination, goToPage, changePageSize, refetch } =
    useBuySignals(minStrength);
  const [selectedSignal, setSelectedSignal] = useState<BuySignal | null>(null);

  // Quick stats
  const highUrgencyCount = signals.filter((s) => s.urgency === 'HIGH').length;
  const buyNowCount = signals.filter((s) => s.recommended_action === 'BUY_NOW').length;
  const avgUpside = signals.length
    ? (signals.reduce((sum, s) => sum + s.potential_return, 0) / signals.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              🚨 High Urgency Signals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{highUrgencyCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Action needed soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              💰 BUY NOW Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{buyNowCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to execute</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              📈 Avg Potential Upside
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">+{avgUpside}%</div>
            <p className="text-xs text-muted-foreground mt-1">Expected returns</p>
          </CardContent>
        </Card>
      </div>

      {/* Signal Strength Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            Signal Strength Filter
          </CardTitle>
          <CardDescription>
            Higher strength = More reliable signals • Current: {minStrength}+
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label className="min-w-[100px]">Min Strength:</Label>
              <Slider
                value={[minStrength]}
                onValueChange={(value) => setMinStrength(value[0])}
                min={50}
                max={95}
                step={5}
                className="flex-1"
              />
              <span className="font-bold text-lg min-w-[50px]">{minStrength}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setMinStrength(70)}
                className="px-3 py-1 text-sm rounded bg-blue-100 text-blue-800 hover:bg-blue-200"
              >
                70+ Good
              </button>
              <button
                onClick={() => setMinStrength(80)}
                className="px-3 py-1 text-sm rounded bg-green-100 text-green-800 hover:bg-green-200"
              >
                80+ Strong
              </button>
              <button
                onClick={() => setMinStrength(90)}
                className="px-3 py-1 text-sm rounded bg-purple-100 text-purple-800 hover:bg-purple-200"
              >
                90+ Elite
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signals Table */}
      {loading && <LoadingSpinner message="Loading buy signals..." />}
      {error && <ErrorMessage message={error} />}
      {!loading && !error && (
        <>
          <BuySignalsTable signals={signals} onViewDetails={setSelectedSignal} />

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

      {/* Detail Modal */}
      <BuySignalDetailModal
        signal={selectedSignal}
        open={!!selectedSignal}
        onClose={() => setSelectedSignal(null)}
      />

      {/* Educational Footer */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            How to Use Buy Signals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>
              <strong>Signal Strength 90+:</strong> Elite opportunities with multiple confirming
              factors
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>
              <strong>HIGH Urgency:</strong> Recent buying activity, act within 2-3 days
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>
              <strong>BUY NOW action:</strong> Strong accumulation confirmed, enter immediately
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>
              <strong>Risk Management:</strong> Always use stop-loss. Aim for 3:1 risk-reward
              minimum
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};