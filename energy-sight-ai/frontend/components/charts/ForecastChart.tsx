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
  ReferenceLine
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
  data,
  title = 'Load Forecast (kW)',
  height = 360,
  showCI = true,
}: ForecastChartProps) {
  const formattedData = data.map((d: any) => {
    // Normalize CI field names: backend uses lower_bound/upper_bound, chart uses lower_ci/upper_ci
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
    <div className="w-full bg-graphite-950 p-4 rounded-xl border border-graphite-800/80 shadow-xl">
      {title && (
        <div className="flex items-center justify-between mb-3 border-b border-graphite-800 pb-2">
          <h3 className="font-mono text-xs text-graphite-200 uppercase tracking-wider font-semibold">
            {title}
          </h3>
          <span className="font-mono text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
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
                <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />

            <XAxis
              dataKey="timeStr"
              stroke="#64748b"
              tick={{ fontSize: 10, fontFamily: 'monospace' }}
              tickLine={false}
            />

            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 10, fontFamily: 'monospace' }}
              unit=" kW"
              domain={['auto', 'auto']}
              tickLine={false}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#14b8a6',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px',
                fontFamily: 'monospace',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              }}
              formatter={(val: any, name: string) => {
                if (typeof val === 'number') return [`${val.toFixed(2)} kW`, name];
                return [val, name];
              }}
            />

            <Legend
              wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }}
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
              strokeWidth={2}
              fill="url(#actualGrad)"
              name="Actual Consumption"
            />

            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#06b6d4"
              strokeWidth={2.5}
              strokeDasharray="4 2"
              dot={{ r: 2, fill: '#06b6d4' }}
              name="AI Model Forecast"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
