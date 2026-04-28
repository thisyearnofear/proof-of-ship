/**
 * BagsMarketCard
 * Displays real-time Bags token market data.
 */

import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { LoadingSpinner } from '../common/LoadingStates';
import { CurrencyDollarIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

export default function BagsMarketCard({ mint }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mint) return;
    
    async function fetchMarketData() {
      try {
        setLoading(true);
        // Using Bags SDK state service
        // In a real app, inject the SDK instance via context or service manager
        const res = await fetch(`/api/bags/market?mint=${mint}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to fetch market data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMarketData();
  }, [mint]);

  if (loading) return <Card className="p-4"><LoadingSpinner size="sm" /></Card>;
  if (!data) return null;

  return (
    <Card className="p-4 bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-bold text-emerald-900 text-sm">Bags Market Alpha</h4>
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">LIVE</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[9px] font-bold text-gray-400 uppercase">Price</p>
          <p className="text-sm font-bold text-gray-900">${data.price?.toFixed(4)}</p>
        </div>
        <div>
          <p className="text-[9px] font-bold text-gray-400 uppercase">MCap</p>
          <p className="text-sm font-bold text-gray-900">${(data.marketCap / 1000).toFixed(1)}K</p>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center justify-between">
        <p className="text-[9px] text-gray-500">24h Vol: ${data.volume24h?.toLocaleString()}</p>
        <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-600" />
      </div>
    </Card>
  );
}
