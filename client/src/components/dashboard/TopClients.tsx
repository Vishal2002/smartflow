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
import { formatCurrency } from '@/utils/formatters';
import { COLORS } from '@/utils/constants';
import type { TopClient } from '@/types/stats.type';

interface TopClientsChartProps {
  data: TopClient[];
}

export const TopClientsChart: React.FC<TopClientsChartProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Clients by Value</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="client_name"
              angle={-45}
              textAnchor="end"
              height={100}
              fontSize={11}
            />
            <YAxis />
            <Tooltip
            // @ts-ignore
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <Bar dataKey="total_value" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};