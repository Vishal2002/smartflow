import React from 'react';
import { Activity, TrendingUp, Target, Users } from 'lucide-react';
import { useStats } from '@/hooks/useStats';
import { useAccumulation } from '@/hooks/useAccumulation';
import { LoadingSpinner } from '@/components/common/loader';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { TopClientsChart } from '@/components/dashboard/TopClients';
import { ActiveSymbolsChart } from '@/components/dashboard/ActiveSymbolsCharts';
import { AccumulationTable } from '@/components/dashboard/AccumulationTable';

export const Dashboard: React.FC = () => {
  const { stats, topClients, activeSymbols, loading: statsLoading, error: statsError } = useStats();
  const { patterns, loading: patternsLoading, error: patternsError } = useAccumulation();

  if (statsLoading || patternsLoading) {
    return <LoadingSpinner message="Loading dashboard data..." />;
  }

  if (statsError || patternsError) {
    return <ErrorMessage message={statsError || patternsError || 'An error occurred'} />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Deals (30d)"
          value={stats?.total_deals || 0}
          subtitle="Across NSE & BSE"
          icon={Activity}
          iconColor="bg-blue-500"
          trend={12}
        />
        <StatsCard
          title="Today's Deals"
          value={stats?.today_deals || 0}
          subtitle="Fresh insights"
          icon={TrendingUp}
          iconColor="bg-green-500"
        />
        <StatsCard
          title="Strong Long-Term"
          value={stats?.strong_longterm || 0}
          subtitle="High conviction"
          icon={Target}
          iconColor="bg-purple-500"
        />
        <StatsCard
          title="Accumulation Patterns"
          value={stats?.accumulation_patterns || 0}
          subtitle="Active patterns"
          icon={Users}
          iconColor="bg-orange-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopClientsChart data={topClients} />
        <ActiveSymbolsChart data={activeSymbols} />
      </div>

      {/* Accumulation Patterns Table */}
      <AccumulationTable patterns={patterns} limit={10} />
    </div>
  );
};