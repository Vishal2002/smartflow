import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/formatters";
import type { AccumulationPattern } from "@/types/deals.type";

interface AccumulationTableProps {
  patterns: AccumulationPattern[];
  limit?: number;
}

export const AccumulationTable: React.FC<AccumulationTableProps> = ({
  patterns,
  limit = 10,
}) => {
  const displayPatterns = patterns.slice(0, limit);

  const getDeliveryColor = (percent: number) => {
    if (percent > 90) return "text-green-600 font-semibold";
    if (percent > 70) return "text-yellow-600 font-semibold";
    return "text-muted-foreground font-semibold";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔥 Active Accumulation Patterns
        </CardTitle>
        <CardDescription>
          Clients showing strong buying interest
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead className="text-right">Total Buys</TableHead>
              <TableHead className="text-right">Total Value</TableHead>
              <TableHead className="text-right">Avg Delivery</TableHead>
              <TableHead className="text-right">Consecutive</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayPatterns.map((pattern, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium max-w-50 truncate">
                  {pattern.client_name}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{pattern.symbol}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {pattern.total_buy_deals}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(pattern.total_buy_value)}
                </TableCell>
                <TableCell
                  className={`text-right ${getDeliveryColor(
                    Number(pattern.avg_delivery_percent ?? 0)
                  )}`}
                >
                  {Number(pattern.avg_delivery_percent ?? 0).toFixed(1)}%
                </TableCell>

                <TableCell className="text-right">
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800"
                  >
                    {pattern.consecutive_buys} buys
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
