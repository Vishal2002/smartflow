import React from 'react';
import { Filter, Search, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DealFilters as DealFiltersType } from '@/types/deals.type';

interface EnhancedDealFiltersProps {
  filters: DealFiltersType;
  onFilterChange: (filters: Partial<DealFiltersType>) => void;
  onApply: () => void;
  onReset: () => void;
}

export const EnhancedDealFilters: React.FC<EnhancedDealFiltersProps> = ({
  filters,
  onFilterChange,
  onApply,
  onReset,
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Smart Filters - Focus on Money-Making Deals
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onReset}>
          Reset
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Row 1: Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Action Filter - DEFAULT BUY */}
          <div className="space-y-2">
            <Label htmlFor="action">Action Type</Label>
            <Select
              value={filters.action}
              onValueChange={(value: 'BUY' | 'SELL' | 'ALL') =>
                onFilterChange({ action: value })
              }
            >
              <SelectTrigger id="action">
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BUY">💰 BUY Only (Money Moves)</SelectItem>
                <SelectItem value="SELL">⚠️ SELL Only</SelectItem>
                <SelectItem value="ALL">All Transactions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Exchange Filter */}
          <div className="space-y-2">
            <Label htmlFor="exchange">Exchange</Label>
            <Select
              value={filters.exchange}
              onValueChange={(value) => onFilterChange({ exchange: value })}
            >
              <SelectTrigger id="exchange">
                <SelectValue placeholder="Select exchange" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Exchanges</SelectItem>
                <SelectItem value="NSE">NSE</SelectItem>
                <SelectItem value="BSE">BSE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Deal Type Filter */}
          <div className="space-y-2">
            <Label htmlFor="dealType">Deal Type</Label>
            <Select
              value={filters.dealType}
              onValueChange={(value) => onFilterChange({ dealType: value })}
            >
              <SelectTrigger id="dealType">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="BLOCK">Block Deals</SelectItem>
                <SelectItem value="BULK">Bulk Deals</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search Filter */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                className="pl-10"
                value={filters.search}
                onChange={(e) => onFilterChange({ search: e.target.value })}
                placeholder="Symbol, Client..."
              />
            </div>
          </div>
        </div>

        {/* Row 2: Money-Making Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Min Delivery % */}
          <div className="space-y-2">
            <Label htmlFor="minDelivery">Min Delivery %</Label>
            <Input
              id="minDelivery"
              type="number"
              min="0"
              max="100"
              value={filters.minDelivery}
              onChange={(e) =>
                onFilterChange({ minDelivery: parseInt(e.target.value) || 0 })
              }
              placeholder="e.g., 85"
            />
            <p className="text-xs text-muted-foreground">High delivery = High conviction</p>
          </div>

          {/* Min Deal Value */}
          <div className="space-y-2">
            <Label htmlFor="minDealValue" className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Min Deal Value (₹Cr)
            </Label>
            <Input
              id="minDealValue"
              type="number"
              min="0"
              value={filters.minDealValue / 10000000 || ''}
              onChange={(e) =>
                onFilterChange({
                  minDealValue: (parseFloat(e.target.value) || 0) * 10000000,
                })
              }
              placeholder="e.g., 1"
            />
            <p className="text-xs text-muted-foreground">Only significant deals</p>
          </div>

          {/* Min Consecutive Buys */}
          <div className="space-y-2">
            <Label htmlFor="minConsecutive">Min Consecutive Buys</Label>
            <Input
              id="minConsecutive"
              type="number"
              min="0"
              max="10"
              value={filters.minConsecutiveBuys}
              onChange={(e) =>
                onFilterChange({ minConsecutiveBuys: parseInt(e.target.value) || 0 })
              }
              placeholder="e.g., 3"
            />
            <p className="text-xs text-muted-foreground">Repeated buying pattern</p>
          </div>

          {/* Holding Type */}
          <div className="space-y-2">
            <Label htmlFor="holdingType">Holding Type</Label>
            <Select
              value={filters.holdingType?.[0] || 'ALL'}
              onValueChange={(value) =>
                onFilterChange({
                  holdingType: value === 'ALL' ? [] : [value],
                })
              }
            >
              <SelectTrigger id="holdingType">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="STRONG_LONGTERM">🔥 Strong Long-term</SelectItem>
                <SelectItem value="MODERATE_LONGTERM">📈 Moderate Long-term</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 3: Quick Toggles */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="onlyAccumulation"
              checked={filters.onlyAccumulation}
              onCheckedChange={(checked:any) =>
                onFilterChange({ onlyAccumulation: checked as boolean })
              }
            />
            <Label
              htmlFor="onlyAccumulation"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              🔥 Only Accumulating Clients
            </Label>
          </div>

          <div className="text-sm text-muted-foreground">
            📅 Showing last 2 months data by default
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onReset}>
            Clear All
          </Button>
          <Button onClick={onApply}>Apply Filters</Button>
        </div>
      </CardContent>
    </Card>
  );
};