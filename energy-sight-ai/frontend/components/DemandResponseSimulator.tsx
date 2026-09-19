'use client';

import React, { useState, useMemo } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { 
  Sliders, 
  Zap, 
  Leaf, 
  DollarSign, 
  TrendingDown, 
  RotateCcw,
  Sun
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

interface ForecastPoint {
  timestamp: string;
  predicted: number;
  type?: string;
  [key: string]: any;
}

interface SimulatorProps {
  forecastData: ForecastPoint[];
  baseCarbonIntensity?: number; // g CO2 / kWh (e.g. 410)
  electricityRate?: number; // $ / kWh (e.g. 0.14)
}

export function DemandResponseSimulator({
  forecastData,
  baseCarbonIntensity = 410,
  electricityRate = 0.14,
}: SimulatorProps) {
  // Simulator Sliders State
  const [evShiftPct, setEvShiftPct] = useState<number>(20); // % of peak shifted to off-peak
  const [weatherSurgePct, setWeatherSurgePct] = useState<number>(0); // % heatwave surge
  const [batteryClippingKw, setBatteryClippingKw] = useState<number>(30); // kW battery discharge at peak

  // Reset controls
  const handleReset = () => {
    setEvShiftPct(0);
    setWeatherSurgePct(0);
    setBatteryClippingKw(0);
  };

  // Recalculate Modified Load Curve
  const simulatedResults = useMemo(() => {
    if (!forecastData || forecastData.length === 0) {
      return { chartData: [], peakBaseline: 0, peakSimulated: 0, peakKwReduction: 0, costSavings: 0, co2SavedKg: 0 };
    }

    let peakBaseline = 0;
    let peakSimulated = 0;
    let totalBaselineKwh = 0;
    let totalSimulatedKwh = 0;

    const baselineVals = forecastData.map((d) => d.predicted);
    const avgBaseline = baselineVals.reduce((a, b) => a + b, 0) / (baselineVals.length || 1);

    const chartData = forecastData.map((point) => {
      const orig = point.predicted;
      if (orig > peakBaseline) peakBaseline = orig;

      const dateObj = new Date(point.timestamp);
      const hour = isNaN(dateObj.getTime()) ? 12 : dateObj.getHours();

      const isPeakHour = hour >= 17 && hour <= 21;
      const isOffPeakHour = hour >= 0 && hour <= 6;

      let simulated = orig;

      // 1. Weather Surge
      simulated *= (1 + weatherSurgePct / 100);

      // 2. EV Charging Shift
      if (isPeakHour) {
        const peakReduction = orig * (evShiftPct / 100) * 0.4;
        simulated -= peakReduction;
      } else if (isOffPeakHour) {
        const offPeakAddition = avgBaseline * (evShiftPct / 100) * 0.2;
        simulated += offPeakAddition;
      }

      // 3. Battery Storage Peak Clipping
      if (isPeakHour && batteryClippingKw > 0) {
        simulated = Math.max(orig * 0.5, simulated - batteryClippingKw);
      }

      if (simulated > peakSimulated) peakSimulated = simulated;

      totalBaselineKwh += orig;
      totalSimulatedKwh += simulated;

      const label = !isNaN(dateObj.getTime())
        ? dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        : point.timestamp.substring(11, 16) || point.timestamp;

      return {
        timestamp: label,
        baseline: Math.round(orig * 10) / 10,
        simulated: Math.round(simulated * 10) / 10,
        diff: Math.round((simulated - orig) * 10) / 10,
      };
    });

    const peakKwReduction = Math.max(0, peakBaseline - peakSimulated);
    const demandTariffSavings = peakKwReduction * 12.50;
    const energyShiftSavings = (totalBaselineKwh - totalSimulatedKwh) * electricityRate;
    const totalCostSavings = Math.max(0, demandTariffSavings + energyShiftSavings);
    const co2SavedKg = Math.max(0, (peakKwReduction * 24 * (baseCarbonIntensity * 0.25)) / 1000);

    return {
      chartData,
      peakBaseline: Math.round(peakBaseline * 10) / 10,
      peakSimulated: Math.round(peakSimulated * 10) / 10,
      peakKwReduction: Math.round(peakKwReduction * 10) / 10,
      costSavings: Math.round(totalCostSavings),
      co2SavedKg: Math.round(co2SavedKg * 10) / 10,
    };
  }, [forecastData, evShiftPct, weatherSurgePct, batteryClippingKw, baseCarbonIntensity, electricityRate]);

  return (
    <GlassCard glow="teal" className="p-5 space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-graphite-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              DEMAND-RESPONSE WHAT-IF SIMULATOR
              <span className="px-2 py-0.5 text-[9px] rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                LIVE RE-INFERENCE
              </span>
            </h3>
            <p className="text-[11px] font-mono text-graphite-400">
              Simulate grid load shifting, battery storage peak shaving & extreme heatwave surges
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center space-x-1 px-2.5 py-1 rounded bg-graphite-900 text-graphite-300 hover:text-white border border-graphite-700 text-xs font-mono transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Sliders</span>
        </button>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-graphite-950/80 p-4 rounded-xl border border-graphite-800 font-mono">
        
        {/* Slider 1: EV Peak Shift */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-graphite-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-teal-400" />
              EV Peak Charge Shift:
            </span>
            <span className="text-teal-300 font-bold">{evShiftPct}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="60"
            step="5"
            value={evShiftPct}
            onChange={(e) => setEvShiftPct(Number(e.target.value))}
            className="w-full accent-teal-400 cursor-pointer h-1.5 bg-graphite-800 rounded-lg"
          />
          <p className="text-[10px] text-graphite-400">Shift peak charging to 00:00 - 06:00 window</p>
        </div>

        {/* Slider 2: Heatwave Surge */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-graphite-300 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              Heatwave Weather Surge:
            </span>
            <span className="text-amber-300 font-bold">+{weatherSurgePct}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="35"
            step="5"
            value={weatherSurgePct}
            onChange={(e) => setWeatherSurgePct(Number(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer h-1.5 bg-graphite-800 rounded-lg"
          />
          <p className="text-[10px] text-graphite-400">Simulate ambient HVAC cooling load spike</p>
        </div>

        {/* Slider 3: Battery Peak Clipping */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-graphite-300 flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-emerald-400" />
              BESS Battery Shaving:
            </span>
            <span className="text-emerald-300 font-bold">{batteryClippingKw} kW</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="10"
            value={batteryClippingKw}
            onChange={(e) => setBatteryClippingKw(Number(e.target.value))}
            className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-graphite-800 rounded-lg"
          />
          <p className="text-[10px] text-graphite-400">Grid battery discharge during 17:00-21:00 peak</p>
        </div>

      </div>

      {/* KPI Metric Output Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
        
        <div className="p-3 rounded-lg bg-graphite-900 border border-graphite-800 text-center">
          <span className="text-[10px] text-graphite-400 uppercase">Peak kW Shaved</span>
          <div className="text-xl font-bold text-teal-300 mt-0.5 flex items-center justify-center gap-1">
            <TrendingDown className="w-4 h-4 text-teal-400" />
            {simulatedResults.peakKwReduction} kW
          </div>
        </div>

        <div className="p-3 rounded-lg bg-graphite-900 border border-graphite-800 text-center">
          <span className="text-[10px] text-graphite-400 uppercase">Est. Monthly Savings</span>
          <div className="text-xl font-bold text-emerald-300 mt-0.5 flex items-center justify-center gap-1">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            ${simulatedResults.costSavings.toLocaleString()}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-graphite-900 border border-graphite-800 text-center">
          <span className="text-[10px] text-graphite-400 uppercase">CO₂ Carbon Offset</span>
          <div className="text-xl font-bold text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
            <Leaf className="w-4 h-4 text-emerald-400" />
            {simulatedResults.co2SavedKg} kg
          </div>
        </div>

        <div className="p-3 rounded-lg bg-graphite-900 border border-graphite-800 text-center">
          <span className="text-[10px] text-graphite-400 uppercase">Simulated Peak Load</span>
          <div className="text-xl font-bold text-cyan-300 mt-0.5">
            {simulatedResults.peakSimulated} kW
          </div>
        </div>

      </div>

      {/* Interactive Overlay Recharts */}
      <div className="h-[280px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={simulatedResults.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="simulatedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="timestamp" stroke="#6b7280" tick={{ fontSize: 10, fill: '#9ca3af' }} />
            <YAxis stroke="#6b7280" tick={{ fontSize: 10, fill: '#9ca3af' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#090d16',
                borderColor: '#1f2937',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px',
                fontFamily: 'monospace',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
            <Line
              type="monotone"
              dataKey="baseline"
              name="Original Forecast (Baseline)"
              stroke="#64748b"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="simulated"
              name="Simulated Demand Curve"
              stroke="#14b8a6"
              strokeWidth={2.5}
              fill="url(#simulatedGradient)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

    </GlassCard>
  );
}
