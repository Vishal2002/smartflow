import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Dashboard } from '@/pages/Dashboard';
import { DealsPage } from '@/pages/DealsPage';
import { useStats } from '@/hooks/useStats';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'deals'>('dashboard');
  const { stats, refetch } = useStats();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header onRefresh={refetch} />

      {/* Navigation Tabs */}
      <div className="border-b">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('deals')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'deals'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
              }`}
            >
              All Deals
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'deals' && <DealsPage />}
      </main>

      {/* Footer */}
      <Footer avgDelivery={stats?.avg_delivery_percent || 0} />
    </div>
  );
}

export default App;