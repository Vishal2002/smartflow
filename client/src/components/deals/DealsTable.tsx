import React from "react";
import { Eye, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatNumber } from "@/utils/formatters";
import { HOLDING_TYPE_CONFIG } from "@/utils/constants";
import type { Deal } from "@/types/deals.type";

interface DealsTableProps {
  deals: Deal[];
  onViewDetails: (deal: Deal) => void;
  onRefresh?: () => void;
}

export const DealsTable: React.FC<DealsTableProps> = ({
  deals,
  onViewDetails,
  onRefresh,
}) => {
  const getDeliveryBadgeClass = (percent?: number) => {
    if (typeof percent !== 'number') return "bg-gray-100 text-gray-600";
    if (percent > 90) return "bg-green-100 text-green-800";
    if (percent > 70) return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-600";
  };

  const getHoldingConfig = (type?: string) => {
    return HOLDING_TYPE_CONFIG[type as keyof typeof HOLDING_TYPE_CONFIG] ?? {
      label: "—",
      class: "bg-gray-100 text-gray-600",
    };
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Deals</CardTitle>
          <CardDescription>{deals.length} deals found</CardDescription>
        </div>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {deals.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No deals to display with current filters
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-center">Delivery %</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="text-center">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals.map((deal, index) => {
                  // Fallback key if id is missing (very defensive)
                  const key = deal?.id ?? `deal-${index}`;

                  const holdingConfig = getHoldingConfig(deal?.holding_type);

                  return (
                    <TableRow key={key}>
                      <TableCell className="text-sm text-muted-foreground">
                        {deal?.deal_date ? formatDate(deal.deal_date) : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {deal?.symbol ?? '—'}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {deal?.exchange ?? '?'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">
                        {deal?.client_name ?? '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        {deal?.action ? (
                          <Badge
                            variant={deal.action === "BUY" ? "default" : "destructive"}
                            className={
                              deal.action === "BUY"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {deal.action}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {typeof deal?.quantity === 'number'
                          ? formatNumber(deal.quantity)
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {typeof deal?.deal_value === 'number'
                          ? formatCurrency(deal.deal_value)
                          : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={getDeliveryBadgeClass(deal?.delivery_percent)}
                        >
                          {typeof deal?.delivery_percent === 'number'
                            ? `${deal.delivery_percent.toFixed(1)}%`
                            : '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={holdingConfig.class}>
                          {holdingConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deal && onViewDetails(deal)}
                          disabled={!deal}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};