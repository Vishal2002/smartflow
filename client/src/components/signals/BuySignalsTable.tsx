import React from 'react';
import { TrendingUp, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/utils/formatters';
import type { BuySignal } from '@/types/deals.type';

interface BuySignalsTableProps {
  signals: BuySignal[];
  onViewDetails: (signal: BuySignal) => void;
}

export const BuySignalsTable: React.FC<BuySignalsTableProps> = ({
  signals,
  onViewDetails,
}) => {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'BUY_NOW':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'BUY_ON_DIP':
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'MONITOR':
        return <Target className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💰 Actionable Buy Signals
        </CardTitle>
        <CardDescription>
          High-conviction institutional buying patterns - Ready to trade
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Signal</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Primary Buyer</TableHead>
                <TableHead className="text-right">Entry</TableHead>
                <TableHead className="text-right">Target</TableHead>
                <TableHead className="text-right">Upside</TableHead>
                <TableHead className="text-center">Action</TableHead>
                <TableHead className="text-center">Urgency</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {signals.map((signal) => (
                <TableRow key={signal.id} className="hover:bg-muted/50">
                  {/* Signal Strength */}
                  <TableCell>
                    <div className="flex flex-col items-center">
                      <div
                        className={`text-2xl font-bold ${
                          signal.signal_strength >= 85
                            ? 'text-green-600'
                            : signal.signal_strength >= 70
                            ? 'text-blue-600'
                            : 'text-yellow-600'
                        }`}
                      >
                        {signal.signal_strength}
                      </div>
                      <div className="text-xs text-muted-foreground">/ 100</div>
                    </div>
                  </TableCell>

                  {/* Stock Info */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-base">{signal.symbol}</span>
                      <span className="text-xs text-muted-foreground max-w-[150px] truncate">
                        {signal.company_name}
                      </span>
                      <Badge variant="outline" className="mt-1 w-fit text-xs">
                        {signal.signal_type}
                      </Badge>
                    </div>
                  </TableCell>

                  {/* Primary Buyer */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium max-w-[150px] truncate">
                        {signal.primary_buyer}
                      </span>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {signal.consecutive_buys}x buys
                        </span>
                        <span className="text-xs text-green-600 font-semibold">
                          • {signal.buyer_track_record}% success
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Entry Price */}
                  <TableCell className="text-right">
                    <div className="flex flex-col">
                      <span className="font-semibold text-base">
                        ₹{signal.entry_price.toFixed(2)}
                      </span>
                      <span className="text-xs text-red-600">
                        SL: ₹{signal.stop_loss.toFixed(2)}
                      </span>
                    </div>
                  </TableCell>

                  {/* Target Price */}
                  <TableCell className="text-right">
                    <div className="flex flex-col">
                      <span className="font-semibold text-green-600 text-base">
                        ₹{signal.target_price.toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        R:R {signal.risk_reward_ratio.toFixed(1)}
                      </span>
                    </div>
                  </TableCell>

                  {/* Potential Return */}
                  <TableCell className="text-right">
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 font-bold text-base"
                    >
                      +{signal.potential_return.toFixed(0)}%
                    </Badge>
                  </TableCell>

                  {/* Recommended Action */}
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      {getActionIcon(signal.recommended_action)}
                      <span className="text-xs font-medium">
                        {signal.recommended_action.replace('_', ' ')}
                      </span>
                    </div>
                  </TableCell>

                  {/* Urgency */}
                  <TableCell className="text-center">
                    <Badge variant="outline" className={getUrgencyColor(signal.urgency)}>
                      {signal.urgency}
                    </Badge>
                  </TableCell>

                  {/* View Details */}
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(signal)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Details →
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};