import React from 'react';
import { Filter, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DealFilters as DealFiltersType } from '@/types/deals.type';

interface DealFiltersProps {
  filters: DealFiltersType;
  onFilterChange: (filters: Partial<DealFiltersType>) => void;
  onApply: () => void;
  onReset: () => void;
}

export const DealFilters: React.FC<DealFiltersProps> = ({
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
          Filters
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onReset}>
          Reset
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          {/* Min Delivery Filter */}
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
              placeholder="0-100"
            />
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

        <div className="mt-4 flex justify-end">
          <Button onClick={onApply}>Apply Filters</Button>
        </div>
      </CardContent>
    </Card>
  );
};
