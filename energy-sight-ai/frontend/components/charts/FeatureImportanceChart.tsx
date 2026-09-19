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

interface FeatureImportanceItem {
  feature: string;
  importance: number;
}

interface FeatureImportanceChartProps {
  features: FeatureImportanceItem[];
  modelName?: string;
}

export function FeatureImportanceChart({
  features,
  modelName = 'XGBoost',
}: FeatureImportanceChartProps) {
  const sorted = [...features].sort((a, b) => b.importance - a.importance).slice(0, 10);

  return (
    <div className="w-full bg-graphite-950 p-4 rounded-xl border border-graphite-800/80 shadow-xl">
      <div className="flex items-center justify-between mb-3 border-b border-graphite-800 pb-2">
        <h3 className="font-mono text-xs text-graphite-200 uppercase tracking-wider font-semibold">
          Predictive Feature Influence ({modelName})
        </h3>
        <span className="font-mono text-[10px] text-teal-400">
          SHAP / Tree Gain
        </span>
      </div>

      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
            <XAxis
              type="number"
              stroke="#64748b"
              tick={{ fontSize: 10, fontFamily: 'monospace' }}
            />
            <YAxis
              dataKey="feature"
              type="category"
              stroke="#cbd5e1"
              tick={{ fontSize: 11, fontFamily: 'monospace' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#14b8a6',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px',
                fontFamily: 'monospace',
              }}
              formatter={(val: number) => [`${(val * 100).toFixed(2)}%`, 'Relative Weight']}
            />
            <Bar dataKey="importance" fill="#14b8a6" radius={[0, 4, 4, 0]}>
              {sorted.map((_, i) => (
                <Cell key={i} fill={`rgba(20, 184, 166, ${1 - i * 0.07})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[10px] font-mono text-graphite-400 mt-2 text-center">
        * Feature importance measures predictive influence in the model pipeline, not physical causation.
      </p>
    </div>
  );
}
