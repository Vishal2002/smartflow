export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  indigo: '#6366f1',
};

export const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const HOLDING_TYPE_CONFIG = {
  STRONG_LONGTERM: {
    label: '🔥 Strong Long',
    variant: 'default' as const,
    class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  MODERATE_LONGTERM: {
    label: '📈 Moderate Long',
    variant: 'secondary' as const,
    class: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  },
  SHORTTERM_POTENTIAL: {
    label: '⚡ Short Term',
    variant: 'outline' as const,
    class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  },
  SPECULATION: {
    label: '🎲 Speculative',
    variant: 'outline' as const,
    class: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  },
};

// ============================================
// FILE: src/utils/formatters.ts
// ============================================

export const formatCurrency = (value: number): string => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  return `₹${value.toLocaleString('en-IN')}`;
};

export const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatNumber = (value: number): string => {
  return value.toLocaleString('en-IN');
};

export const formatPercent = (value: number): string => {
  return `${value.toFixed(2)}%`;
};
