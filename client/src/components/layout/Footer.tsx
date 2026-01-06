import React from 'react';

interface FooterProps {
  avgDelivery?: number | string | null;
}

export const Footer: React.FC<FooterProps> = ({ avgDelivery }) => {
  const safeAvgDelivery = Number(avgDelivery ?? 0);

  return (
    <footer className="bg-background border-t mt-12">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            SmartFlow © 2026 • NSE & BSE Deal Intelligence
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Avg Delivery: {safeAvgDelivery.toFixed(1)}%</span>
            <span>•</span>
            <span>Last updated: {new Date().toLocaleTimeString('en-IN')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
