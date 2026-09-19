'use client';

import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

interface AnomalyPoint {
  timestamp: string;
  observed_value: number;
  expected_value: number;
  difference: number;
  severity: 'NORMAL' | 'UNUSUAL' | 'HIGH';
  method: string;
}

interface AnomalyTimelineChartProps {
  anomalies: AnomalyPoint[];
}

export function AnomalyTimelineChart({ anomalies }: AnomalyTimelineChartProps) {
  const formatted = anomalies.map((d) => ({
    ...d,
    timeStr: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    unusualVal: d.severity === 'UNUSUAL' ? d.observed_value : null,
    highVal: d.severity === 'HIGH' ? d.observed_value : null,
  }));

  return (
    <div className="w-full bg-graphite-950 p-4 rounded-xl border border-graphite-800/80 shadow-xl">
      <div className="flex items-center justify-between mb-3 border-b border-graphite-800 pb-2">
        <h3 className="font-mono text-xs text-graphite-200 uppercase tracking-wider font-semibold">
          Anomaly Incident Log & residual deviation scatter
        </h3>
        <div className="flex items-center space-x-3 text-[10px] font-mono">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-amber-300">Unusual</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-rose-400">High Anomaly</span>
          </span>
        </div>
      </div>

      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <ComposedChart data={formatted} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="timeStr"
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
                borderColor: '#f43f5e',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px',
                fontFamily: 'monospace',
              }}
              formatter={(val: any, name: string) => {
                if (typeof val === 'number') return [`${val.toFixed(2)} kW`, name];
                return [val, name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />

            <Line
              type="monotone"
              dataKey="expected_value"
              stroke="#64748b"
              strokeDasharray="3 3"
              strokeWidth={1.5}
              name="Expected Baseline"
              dot={false}
            />

            <Line
              type="monotone"
              dataKey="observed_value"
              stroke="#38bdf8"
              strokeWidth={2}
              name="Observed Consumption"
              dot={{ r: 2 }}
            />

            <Scatter
              dataKey="unusualVal"
              fill="#f59e0b"
              name="Unusual Deviation"
            />

            <Scatter
              dataKey="highVal"
              fill="#f43f5e"
              name="High Anomaly Alert"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
