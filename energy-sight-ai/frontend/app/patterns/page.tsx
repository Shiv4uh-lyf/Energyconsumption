'use client';

import React, { useState, useEffect } from 'react';
import { PatternHeatmap } from '@/components/charts/PatternHeatmap';
import { 
  Activity, 
  Sun, 
  Calendar, 
  Clock, 
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { api, PatternData } from '@/lib/api';

function TrendIcon({ direction }: { direction: string }) {
  if (direction === 'increasing') return <TrendingUp className="w-4 h-4 text-rose-600" />;
  if (direction === 'decreasing') return <TrendingDown className="w-4 h-4 text-emerald-600" />;
  return <Minus className="w-4 h-4 text-cyan-600" />;
}

export default function PatternExplorerPage() {
  const [patterns, setPatterns] = useState<PatternData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchPatterns = async () => {
    setLoading(true);
    try {
      const res = await api.getPatterns();
      if (res.hourly_profile && !res.hourly) {
        res.hourly = res.hourly_profile;
      }
      setPatterns(res);
    } catch (err) {
      console.error('Failed to fetch pattern analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatterns();
  }, []);

  const peakHour = patterns?.peak_hour ?? 18;
  const troughHour = patterns?.trough_hour ?? 3;
  const peakDay = patterns?.peak_day ?? 'Monday';
  const lowDay = patterns?.low_day ?? 'Sunday';
  const weekendDiff = patterns?.weekend_vs_weekday_pct ?? -14.2;
  const trend = patterns?.trend_direction ?? 'stable';

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#121212] tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-zinc-900" />
            PATTERN EXPLORER & SEASONAL DECOMPOSITION
          </h1>
          <p className="text-xs font-semibold text-zinc-600 mt-1">
            Diurnal 24h load profile heatmaps, weekday vs. weekend variance, and trend analysis
          </p>
        </div>

        <button
          onClick={fetchPatterns}
          className="i-btn-black px-4 py-2 flex items-center space-x-2 shadow-sm text-xs"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Peak Demand Hour */}
        <div className="i-card-dark p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-300">
            <span className="text-xs font-extrabold uppercase tracking-wider">Peak Demand Hour</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-white">{peakHour}:00</span>
          </div>
          <p className="text-xs font-semibold text-zinc-300">
            Highest average load window
          </p>
        </div>

        {/* Overnight Trough Hour */}
        <div className="i-card-dark p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-300">
            <span className="text-xs font-extrabold uppercase tracking-wider">Overnight Trough</span>
            <Sun className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-cyan-300">{troughHour}:00</span>
          </div>
          <p className="text-xs font-semibold text-zinc-300">
            Lowest baseline load window
          </p>
        </div>

        {/* Peak Day of Week */}
        <div className="i-card-dark p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-300">
            <span className="text-xs font-extrabold uppercase tracking-wider">Peak Load Day</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-emerald-300">{peakDay}</span>
          </div>
          <p className="text-xs font-semibold text-zinc-300">
            Highest daily volume
          </p>
        </div>

        {/* Weekend Variance */}
        <div className="i-card-dark p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-300">
            <span className="text-xs font-extrabold uppercase tracking-wider">Weekend Variance</span>
            <TrendIcon direction={trend} />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-white">
              {weekendDiff > 0 ? `+${weekendDiff.toFixed(1)}%` : `${weekendDiff.toFixed(1)}%`}
            </span>
          </div>
          <p className="text-xs font-semibold text-zinc-300">
            vs. weekday baseline
          </p>
        </div>

      </div>

      {/* Heatmap Section */}
      <div className="i-card-white p-6 space-y-4">
        <h2 className="text-base font-extrabold text-[#121212]">
          Diurnal 24-Hour Consumption Heatmap Matrix
        </h2>
        <PatternHeatmap patternData={patterns} />
      </div>

    </div>
  );
}
