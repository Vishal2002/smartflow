import React from 'react';
import { Target } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate, formatNumber } from '@/utils/formatters';
import type { Deal } from '@/types/deals.type';

interface DealDetailModalProps {
  deal: Deal | null;
  open: boolean;
  onClose: () => void;
}

export const DealDetailModal: React.FC<DealDetailModalProps> = ({
  deal,
  open,
  onClose,
}) => {
  if (!deal) return null;

  // ✅ Normalize numeric fields (API safety)
  const deliveryPercent = Number(deal.delivery_percent);
  const safeDeliveryPercent = Number.isFinite(deliveryPercent)
    ? deliveryPercent
    : 0;

  const dealValue = Number(deal.deal_value) || 0;
  const quantity = Number(deal.quantity) || 0;
  const price = Number(deal.price) || 0;

  // 🔍 Trading Signals
  const tradingSignals = [
    {
      condition: safeDeliveryPercent > 90,
      text: 'High conviction buy (delivery > 90%)',
    },
    {
      condition: Boolean(deal.is_accumulating),
      text: 'Strong accumulation pattern detected',
    },
    {
      condition: dealValue > 50_000_000,
      text: 'Large institutional position (> ₹50Cr)',
    },
    {
      condition: deal.holding_type === 'STRONG_LONGTERM',
      text: 'Classified as strong long-term holding',
    },
  ].filter((signal) => signal.condition);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{deal.symbol}</DialogTitle>
          <DialogDescription>{deal.company_name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* ================= Deal Overview ================= */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Deal Value</p>
              <p className="text-2xl font-bold">
                {formatCurrency(dealValue)}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Delivery %</p>
              <p className="text-2xl font-bold text-green-600">
                {safeDeliveryPercent.toFixed(2)}%
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Quantity</p>
              <p className="text-lg font-semibold">
                {formatNumber(quantity)}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="text-lg font-semibold">₹{price}</p>
            </div>
          </div>

          <Separator />

          {/* ================= Client Analysis ================= */}
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Client Analysis</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Client Name:</span>
                <span className="font-medium">{deal.client_name}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Action:</span>
                <Badge
                  variant={deal.action === 'BUY' ? 'default' : 'destructive'}
                  className={
                    deal.action === 'BUY'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }
                >
                  {deal.action}
                </Badge>
              </div>

              {deal.is_accumulating && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Pattern:</span>
                  <Badge className="bg-green-100 text-green-800">
                    🔥 Accumulating ({deal.consecutive_buys ?? 0} consecutive buys)
                  </Badge>
                </div>
              )}

              {deal.total_buy_deals != null && deal.total_buy_deals > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Buy Deals:</span>
                  <span className="font-medium">
                    {deal.total_buy_deals}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ================= Trading Signals ================= */}
          {tradingSignals.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                Trading Signals
              </h3>

              <div className="space-y-2">
                {tradingSignals.map((signal, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-sm">{signal.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= Metadata ================= */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Exchange</p>
              <p className="text-sm font-medium">{deal.exchange}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Deal Type</p>
              <p className="text-sm font-medium">{deal.deal_type}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="text-sm font-medium">
                {formatDate(deal.deal_date)}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
