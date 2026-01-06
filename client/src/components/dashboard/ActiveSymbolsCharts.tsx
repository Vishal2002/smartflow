import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { COLORS } from '@/utils/constants';
import type { ActiveSymbol } from '@/types/stats.type';

interface ActiveSymbolsChartProps {
  data: ActiveSymbol[];
}

export const ActiveSymbolsChart: React.FC<ActiveSymbolsChartProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Most Active Symbols</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="symbol" />
            <YAxis />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
            <Bar dataKey="deal_count" fill={COLORS.success} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
