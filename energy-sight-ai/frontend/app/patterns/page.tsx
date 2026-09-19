'use client';

import React, { useState, useEffect } from 'react';
import { PatternHeatmap } from '@/components/charts/PatternHeatmap';
import { GlassCard } from '@/components/GlassCard';
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
  if (direction === 'increasing') return <TrendingUp className="w-4 h-4 text-rose-400" />;
  if (direction === 'decreasing') return <TrendingDown className="w-4 h-4 text-emerald-400" />;
  return <Minus className="w-4 h-4 text-cyan-400" />;
}

export default function PatternExplorerPage() {
  const [patterns, setPatterns] = useState<PatternData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchPatterns = async () => {
    setLoading(true);
    try {
      const res = await api.getPatterns();
      // Add alias so PatternHeatmap can use either key
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

  // Derive display values from actual data
  const peakHour = patterns?.peak_hour ?? 18;
  const troughHour = patterns?.trough_hour ?? 3;
  const peakDay = patterns?.peak_day ?? 'Monday';
  const lowDay = patterns?.low_day ?? 'Sunday';
  const weekendDiff = patterns?.weekend_vs_weekday_pct ?? -14.2;
  const trend = patterns?.trend_direction ?? 'stable';
  const baselineDiff = patterns?.baseline_diff_pct ?? 0;

  const dailyProfile = patterns?.daily_profile ?? [];

  // Build display consumption per day from actual data
  const dayConsumption: Record<string, number> = {};
  dailyProfile.forEach(d => {
    dayConsumption[d.day] = d.mean;
  });
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxDayVal = Math.max(...Object.values(dayConsumption), 1);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-graphite-800/80 pb-4">
        <div>
          <h1 className="font-mono text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-amber-400" />
            PATTERN & SEASONALITY EXPLORER
          </h1>
          <p className="text-xs font-mono text-graphite-400 mt-1">
            Diurnal cycles, weekday vs. weekend shifts, and temporal load signature analysis
          </p>
        </div>
        <button
          onClick={fetchPatterns}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-mono transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Spatial Pattern Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <GlassCard glow="amber" className="p-4">
          <div className="flex items-center justify-between text-graphite-400 mb-2">
            <span className="font-mono text-xs uppercase font-semibold">Peak Demand Window</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-mono font-bold text-2xl text-amber-300">
            {loading ? '—' : `${String(peakHour).padStart(2, '0')}:00`}
          </div>
          <p className="text-[10px] font-mono text-graphite-400 mt-1">
            Daily peak load hour
          </p>
        </GlassCard>

        <GlassCard glow="cyan" className="p-4">
          <div className="flex items-center justify-between text-graphite-400 mb-2">
            <span className="font-mono text-xs uppercase font-semibold">Minimum Base Load</span>
            <Sun className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="font-mono font-bold text-2xl text-cyan-300">
            {loading ? '—' : `${String(troughHour).padStart(2, '0')}:00`}
          </div>
          <p className="text-[10px] font-mono text-graphite-400 mt-1">
            Overnight baseline trough
          </p>
        </GlassCard>

        <GlassCard glow="teal" className="p-4">
          <div className="flex items-center justify-between text-graphite-400 mb-2">
            <span className="font-mono text-xs uppercase font-semibold">Weekend vs Weekday</span>
            <Calendar className="w-4 h-4 text-teal-400" />
          </div>
          <div className={`font-mono font-bold text-2xl ${weekendDiff < 0 ? 'text-teal-300' : 'text-rose-300'}`}>
            {loading ? '—' : `${weekendDiff > 0 ? '+' : ''}${weekendDiff.toFixed(1)}%`}
          </div>
          <p className="text-[10px] font-mono text-graphite-400 mt-1">
            {weekendDiff < 0 ? 'Lower' : 'Higher'} on Sat/Sun vs. weekdays
          </p>
        </GlassCard>

        <GlassCard glow="none" className="p-4">
          <div className="flex items-center justify-between text-graphite-400 mb-2">
            <span className="font-mono text-xs uppercase font-semibold">Trend Direction</span>
            <TrendIcon direction={trend} />
          </div>
          <div className={`font-mono font-bold text-xl capitalize ${trend === 'increasing' ? 'text-rose-400' : trend === 'decreasing' ? 'text-emerald-400' : 'text-cyan-400'}`}>
            {loading ? '—' : trend}
          </div>
          <p className="text-[10px] font-mono text-graphite-400 mt-1">
            {Math.abs(baselineDiff).toFixed(1)}% vs prior 7-day
          </p>
        </GlassCard>

      </div>

      {/* Main Diurnal Pattern Chart */}
      {patterns ? (
        <PatternHeatmap hourlyData={patterns.hourly_profile} />
      ) : (
        <GlassCard className="p-8 text-center text-graphite-400 font-mono text-xs">
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
              <span>Loading load signature profiles...</span>
            </div>
          ) : 'No pattern data available.'}
        </GlassCard>
      )}

      {/* Day of Week Consumption Index */}
      <GlassCard glow="none" className="p-4">
        <h3 className="font-mono text-xs font-semibold text-graphite-200 uppercase tracking-wider mb-4 border-b border-graphite-800 pb-2">
          Day of Week Consumption Index
        </h3>

        <div className="grid grid-cols-7 gap-2 font-mono text-xs text-center">
          {days.map((day, idx) => {
            const isWeekend = idx >= 5;
            const val = dayConsumption[day];
            const barPct = val ? (val / maxDayVal) * 100 : 0;
            const isPeakDay = day === peakDay;
            return (
              <div
                key={day}
                className={`p-3 rounded-lg border transition-all ${
                  isPeakDay
                    ? 'bg-amber-950/40 border-amber-500/40'
                    : isWeekend
                    ? 'bg-graphite-950/40 border-graphite-800 text-graphite-400'
                    : 'bg-graphite-900 border-teal-500/30 text-teal-300'
                }`}
              >
                <div className="text-[10px] uppercase text-graphite-400 font-bold">{shortDays[idx]}</div>
                <div className="text-sm font-bold my-1.5">
                  {val ? `${(val / 1000).toFixed(1)} MWh` : '—'}
                </div>
                {/* Mini bar */}
                <div className="w-full h-1 bg-graphite-800 rounded-full mt-1">
                  <div
                    className={`h-full rounded-full ${isPeakDay ? 'bg-amber-500' : isWeekend ? 'bg-graphite-600' : 'bg-teal-500'}`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
                <div className="text-[9px] text-graphite-500 mt-1">
                  {isPeakDay ? '▲ Peak' : isWeekend ? 'Off-Peak' : 'Weekday'}
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Monthly Profile */}
      {patterns?.monthly_profile && patterns.monthly_profile.length > 0 && (
        <GlassCard glow="none" className="p-4">
          <h3 className="font-mono text-xs font-semibold text-graphite-200 uppercase tracking-wider mb-4 border-b border-graphite-800 pb-2">
            Monthly Consumption Profile
          </h3>
          <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
            {patterns.monthly_profile.map((m) => {
              const maxM = Math.max(...patterns.monthly_profile.map(x => x.mean), 1);
              const pct = (m.mean / maxM) * 100;
              return (
                <div key={m.month} className="text-center font-mono text-xs">
                  <div className="text-[10px] text-graphite-400 mb-1">{m.month}</div>
                  <div className="w-full h-12 bg-graphite-900 rounded border border-graphite-800 flex flex-col justify-end overflow-hidden">
                    <div
                      className="w-full bg-gradient-to-t from-teal-600 to-teal-400 transition-all"
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-teal-400 mt-1">{m.mean.toFixed(0)}</div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

    </div>
  );
}
