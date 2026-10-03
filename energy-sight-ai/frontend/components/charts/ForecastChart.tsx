'use client';

import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface ForecastDataPoint {
  timestamp: string;
  actual?: number;
  predicted?: number;
  lower_ci?: number;
  upper_ci?: number;
}

interface ForecastChartProps {
  data: ForecastDataPoint[];
  title?: string;
  height?: number;
  showCI?: boolean;
}

export function ForecastChart({
  data = [],
  title = 'Load Forecast (kW)',
  height = 360,
  showCI = true,
}: ForecastChartProps) {
  const safeData = Array.isArray(data) ? data : [];
  const formattedData = safeData.map((d: any) => {
    const lower = d.lower_ci ?? d.lower_bound ?? undefined;
    const upper = d.upper_ci ?? d.upper_bound ?? undefined;
    return {
      ...d,
      lower_ci: lower,
      upper_ci: upper,
      timeStr: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dateStr: new Date(d.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    };
  });

  return (
    <div className="w-full bg-[#121212] p-5 rounded-2xl border border-zinc-800 shadow-xl text-white">
      {title && (
        <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
          <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">
            {title}
          </h3>
          <span className="text-xs font-bold text-teal-300 bg-teal-500/20 px-2.5 py-1 rounded-full border border-teal-500/40">
            {data.length} TIMESTEPS
          </span>
        </div>
      )}

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <ComposedChart data={formattedData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.6} />

            <XAxis
              dataKey="timeStr"
              stroke="#d4d4d8"
              tick={{ fontSize: 11, fontWeight: 600, fill: '#e4e4e7' }}
              tickLine={false}
            />

            <YAxis
              stroke="#d4d4d8"
              tick={{ fontSize: 11, fontWeight: 600, fill: '#e4e4e7' }}
              unit=" kW"
              domain={['auto', 'auto']}
              tickLine={false}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                borderColor: '#2DD4BF',
                borderWidth: '1.5px',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: '600',
                boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
              }}
              formatter={(val: any, name: string) => {
                if (typeof val === 'number') return [`${val.toFixed(2)} kW`, name];
                return [val, name];
              }}
            />

            <Legend
              wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#f4f4f5', paddingTop: '12px' }}
            />

            {showCI && (
              <Area
                type="monotone"
                dataKey="upper_ci"
                stroke="none"
                fill="url(#ciGrad)"
                name="Prediction Interval (95%)"
              />
            )}

            <Area
              type="monotone"
              dataKey="actual"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#actualGrad)"
              name="Actual Consumption"
            />

            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#38bdf8"
              strokeWidth={3}
              strokeDasharray="5 3"
              dot={{ r: 3, fill: '#38bdf8' }}
              name="AI Model Forecast"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
