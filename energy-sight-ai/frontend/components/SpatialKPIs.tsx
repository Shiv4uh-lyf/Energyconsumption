'use client';

import React from 'react';
import { GlassCard } from './GlassCard';
import { 
  Zap, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  Gauge
} from 'lucide-react';

interface SpatialKPIsProps {
  currentLoad?: number;
  todayTotal?: number;
  forecastPeak?: number;
  forecastPeakTime?: string;
  trendPct?: number;
  anomalyCount?: number;
  anomalySeverity?: 'NORMAL' | 'UNUSUAL' | 'HIGH';
}

export function SpatialKPIs({
  currentLoad = 482.5,
  todayTotal = 11450.8,
  forecastPeak = 540.2,
  forecastPeakTime = '18:00',
  trendPct = 3.4,
  anomalyCount = 2,
  anomalySeverity = 'UNUSUAL',
}: SpatialKPIsProps) {
  const isTrendUp = trendPct >= 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 my-4">
      
      {/* 1. Current Load */}
      <GlassCard glow="teal" className="p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-graphite-400">
          <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">Current Load</span>
          <Zap className="w-3.5 h-3.5 text-teal-400" />
        </div>
        <div className="mt-2">
          <div className="flex items-baseline space-x-1">
            <span className="font-mono font-bold text-xl text-white">
              {currentLoad.toFixed(1)}
            </span>
            <span className="font-mono text-xs text-teal-400">kW</span>
          </div>
          <p className="text-[10px] font-mono text-graphite-400 mt-0.5 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span>Live telemetry</span>
          </p>
        </div>
      </GlassCard>

      {/* 2. Today Total */}
      <GlassCard glow="cyan" className="p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-graphite-400">
          <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">Today's Usage</span>
          <Gauge className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="mt-2">
          <div className="flex items-baseline space-x-1">
            <span className="font-mono font-bold text-xl text-white">
              {(todayTotal / 1000).toFixed(2)}
            </span>
            <span className="font-mono text-xs text-cyan-400">MWh</span>
          </div>
          <p className="text-[10px] font-mono text-graphite-400 mt-0.5">
            Cumulative 24h
          </p>
        </div>
      </GlassCard>

      {/* 3. Predicted Peak */}
      <GlassCard glow="amber" className="p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-graphite-400">
          <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">Predicted Peak</span>
          <Clock className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="mt-2">
          <div className="flex items-baseline space-x-1">
            <span className="font-mono font-bold text-xl text-amber-300">
              {forecastPeak.toFixed(1)}
            </span>
            <span className="font-mono text-xs text-amber-400">kW</span>
          </div>
          <p className="text-[10px] font-mono text-graphite-400 mt-0.5 flex items-center justify-between">
            <span>Peak @ {forecastPeakTime}</span>
          </p>
        </div>
      </GlassCard>

      {/* 4. Consumption Trend */}
      <GlassCard glow="none" className="p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-graphite-400">
          <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">Baseline Trend</span>
          <TrendingUp className="w-3.5 h-3.5 text-graphite-400" />
        </div>
        <div className="mt-2">
          <div className="flex items-center space-x-1">
            <span className="font-mono font-bold text-xl text-white">
              {isTrendUp ? `+${trendPct.toFixed(1)}%` : `${trendPct.toFixed(1)}%`}
            </span>
            {isTrendUp ? (
              <ArrowUpRight className="w-4 h-4 text-amber-400" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <p className="text-[10px] font-mono text-graphite-400 mt-0.5">
            vs 7-day rolling mean
          </p>
        </div>
      </GlassCard>

      {/* 5. Anomaly Status */}
      <GlassCard 
        glow={anomalySeverity === 'HIGH' ? 'rose' : anomalySeverity === 'UNUSUAL' ? 'amber' : 'teal'} 
        className="p-3.5 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between text-graphite-400">
          <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">Anomaly Engine</span>
          <AlertTriangle className={`w-3.5 h-3.5 ${
            anomalySeverity === 'HIGH' ? 'text-rose-400' : anomalySeverity === 'UNUSUAL' ? 'text-amber-400' : 'text-emerald-400'
          }`} />
        </div>
        <div className="mt-2">
          <div className="flex items-center space-x-1.5">
            <span className={`font-mono font-bold text-base ${
              anomalySeverity === 'HIGH' ? 'text-rose-400' : anomalySeverity === 'UNUSUAL' ? 'text-amber-300' : 'text-emerald-400'
            }`}>
              {anomalySeverity}
            </span>
            <span className="text-xs font-mono text-graphite-400">
              ({anomalyCount})
            </span>
          </div>
          <p className="text-[10px] font-mono text-graphite-400 mt-0.5">
            IsolationForest z-score
          </p>
        </div>
      </GlassCard>

      {/* 6. AI Readiness Status */}
      <GlassCard glow="cyan" className="p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-graphite-400">
          <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">AI Confidence</span>
          <Activity className="w-3.5 h-3.5 text-teal-400" />
        </div>
        <div className="mt-2">
          <div className="flex items-baseline space-x-1">
            <span className="font-mono font-bold text-xl text-teal-300">
              96.8%
            </span>
          </div>
          <p className="text-[10px] font-mono text-graphite-400 mt-0.5">
            R² Metric score
          </p>
        </div>
      </GlassCard>

    </div>
  );
}
