'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

interface HourlyPattern {
  hour: number;
  mean: number;
  std?: number;
  min?: number;
  max?: number;
}

interface PatternHeatmapProps {
  hourlyData: HourlyPattern[];
}

export function PatternHeatmap({ hourlyData }: PatternHeatmapProps) {
  const formatted = hourlyData.map((d) => {
    const std = d.std ?? 0;
    const minVal = d.min ?? Math.max(0, d.mean - std);
    const maxVal = d.max ?? d.mean + std;
    return {
      ...d,
      hourLabel: `${String(d.hour).padStart(2, '0')}:00`,
      min: minVal,
      max: maxVal,
      range: maxVal - minVal,
    };
  });

  return (
    <div className="w-full bg-graphite-950 p-4 rounded-xl border border-graphite-800/80 shadow-xl">
      <div className="flex items-center justify-between mb-3 border-b border-graphite-800 pb-2">
        <h3 className="font-mono text-xs text-graphite-200 uppercase tracking-wider font-semibold">
          Diurnal Load Profile (24-Hour Average & Variance Envelope)
        </h3>
        <span className="font-mono text-[10px] text-amber-400">
          Peak Window: 17:00 – 21:00
        </span>
      </div>

      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <BarChart data={formatted} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="hourLabel"
              stroke="#64748b"
              tick={{ fontSize: 10, fontFamily: 'monospace' }}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 10, fontFamily: 'monospace' }}
              unit=" kW"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#f59e0b',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px',
                fontFamily: 'monospace',
              }}
              formatter={(val: number, name: string) => [`${val.toFixed(2)} kW`, name]}
            />
            <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
            <Bar dataKey="mean" fill="#06b6d4" name="Average Consumption" radius={[3, 3, 0, 0]} />
            <Bar dataKey="max" fill="#f59e0b" opacity={0.6} name="Max Peak" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
