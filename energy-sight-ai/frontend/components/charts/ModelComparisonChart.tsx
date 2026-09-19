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
  Cell
} from 'recharts';

interface ModelMetric {
  model_name: string;
  mae: number;
  rmse: number;
  mape: number;
  r2: number;
  latency_ms: number;
  rank?: number;
}

interface ModelComparisonChartProps {
  metrics: ModelMetric[];
  selectedMetric?: 'mae' | 'rmse' | 'mape' | 'r2';
}

export function ModelComparisonChart({
  metrics,
  selectedMetric = 'mae',
}: ModelComparisonChartProps) {
  const sorted = [...metrics].sort((a, b) => {
    if (selectedMetric === 'r2') return b.r2 - a.r2; // higher is better
    return a[selectedMetric] - b[selectedMetric]; // lower is better
  });

  const getMetricLabel = (key: string) => {
    switch (key) {
      case 'mae': return 'MAE (Mean Absolute Error) [kW]';
      case 'rmse': return 'RMSE (Root Mean Square Error) [kW]';
      case 'mape': return 'MAPE (Mean Absolute % Error)';
      case 'r2': return 'R² Variance Score';
      default: return key.toUpperCase();
    }
  };

  return (
    <div className="w-full bg-graphite-950 p-4 rounded-xl border border-graphite-800/80 shadow-xl">
      <div className="flex items-center justify-between mb-4 border-b border-graphite-800 pb-2">
        <h3 className="font-mono text-xs text-graphite-200 uppercase tracking-wider font-semibold">
          Model Accuracy Arena Benchmark — {getMetricLabel(selectedMetric)}
        </h3>
        <span className="font-mono text-[10px] text-cyan-400">
          Lower is better (except R²)
        </span>
      </div>

      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
            <XAxis
              type="number"
              stroke="#64748b"
              tick={{ fontSize: 10, fontFamily: 'monospace' }}
            />
            <YAxis
              dataKey="model_name"
              type="category"
              stroke="#cbd5e1"
              tick={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 600 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#06b6d4',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px',
                fontFamily: 'monospace',
              }}
              formatter={(val: number) => [
                selectedMetric === 'mape' ? `${val.toFixed(2)}%` : val.toFixed(3),
                selectedMetric.toUpperCase(),
              ]}
            />
            <Bar dataKey={selectedMetric} radius={[0, 4, 4, 0]}>
              {sorted.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    index === 0
                      ? '#10b981' // Best performer gets emerald highlight
                      : entry.model_name === 'Ensemble'
                      ? '#06b6d4'
                      : '#334155'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
