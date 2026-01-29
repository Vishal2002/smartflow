import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, TrendingUp, Clock, DollarSign } from 'lucide-react';
import type { BuySignal } from '@/types/deals.type';
import { formatDate, formatCurrency } from '@/utils/formatters';

interface BuySignalDetailModalProps {
  signal: BuySignal | null;
  open: boolean;
  onClose: () => void;
}

export const BuySignalDetailModal: React.FC<BuySignalDetailModalProps> = ({
  signal,
  open,
  onClose,
}) => {
  if (!signal) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-3xl">{signal.symbol}</DialogTitle>
              <DialogDescription className="text-base mt-1">
                {signal.company_name}
              </DialogDescription>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-green-600">
                {signal.signal_strength}
              </div>
              <div className="text-sm text-muted-foreground">Signal Strength</div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Action Card */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg p-6 border-2 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-green-600" />
                Trading Plan
              </h3>
              <Badge
                variant="outline"
                className={
                  signal.urgency === 'HIGH'
                    ? 'bg-red-100 text-red-800 border-red-300'
                    : signal.urgency === 'MEDIUM'
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                    : 'bg-blue-100 text-blue-800 border-blue-300'
                }
              >
                {signal.urgency} URGENCY
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Entry Price</div>
                <div className="text-2xl font-bold">₹{signal.entry_price.toFixed(2)}</div>
                <div className="text-xs text-green-600 mt-1 font-semibold">
                  {signal.recommended_action.replace('_', ' ')}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Target</div>
                <div className="text-2xl font-bold text-green-600">
                  ₹{signal.target_price.toFixed(2)}
                </div>
                <div className="text-xs text-green-600 mt-1 font-bold">
                  +{signal.potential_return.toFixed(0)}% Upside
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Stop Loss</div>
                <div className="text-2xl font-bold text-red-600">
                  ₹{signal.stop_loss.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Risk:Reward = 1:{signal.risk_reward_ratio.toFixed(1)}
                </div>
              </div>
            </div>
          </div>

          {/* Why This is a Buy */}
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              Why This is a BUY Signal
            </h3>
            <div className="space-y-2">
              
              {
              //@ts-ignore
              signal.reasons.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-sm">{reason}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Accumulation Details */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Accumulation Pattern
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Primary Buyer</div>
                  <div className="font-semibold">{signal.primary_buyer}</div>
                  <div className="text-xs text-green-600">
                    {signal.buyer_track_record}% Historical Success Rate
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Total Bought (2M)</div>
                  <div className="font-semibold">
                    {signal.total_bought_2m.toLocaleString('en-IN')} shares
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Average Buy Price</div>
                  <div className="font-semibold">₹{signal.avg_buy_price.toFixed(2)}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Consecutive Buys</div>
                  <div className="font-semibold text-green-600 text-xl">
                    {signal.consecutive_buys}x
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Average Delivery</div>
                  <div className="font-semibold text-green-600">
                    {signal.avg_delivery.toFixed(1)}%
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Days in Accumulation</div>
                  <div className="font-semibold">{signal.days_in_accumulation} days</div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Timeline */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              Timeline
            </h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Latest Buy Date:</span>
                <span className="font-medium">{formatDate(signal.latest_buy_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Signal Type:</span>
                <Badge variant="outline">{signal.signal_type}</Badge>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <div className="text-sm text-center">
              <div className="font-semibold mb-2">💡 Recommendation</div>
              <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                {signal.recommended_action === 'BUY_NOW'
                  ? '🚀 BUY NOW - Strong accumulation detected'
                  : signal.recommended_action === 'BUY_ON_DIP'
                  ? '📊 BUY ON DIP - Wait for slight pullback'
                  : signal.recommended_action === 'MONITOR'
                  ? '👀 MONITOR - Early stage accumulation'
                  : '⏳ WAIT - Accumulation not confirmed'}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};