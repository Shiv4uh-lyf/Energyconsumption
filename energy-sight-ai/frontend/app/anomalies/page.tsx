'use client';

import React, { useState, useEffect } from 'react';
import { AnomalyTimelineChart } from '@/components/charts/AnomalyTimelineChart';
import { GlassCard } from '@/components/GlassCard';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Search, 
  Filter, 
  CheckCircle,
  Clock,
  Info
} from 'lucide-react';
import { api } from '@/lib/api';

export default function AnomalyMonitorPage() {
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [acknowledgedTimestamps, setAcknowledgedTimestamps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const res = await api.getAnomalies(72);
      setAnomalies(res.anomalies);
    } catch (err) {
      console.error('Failed to fetch anomalies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const handleAcknowledge = async (ts: string) => {
    try {
      await api.acknowledgeAnomaly(ts);
      setAcknowledgedTimestamps((prev) => new Set(prev).add(ts));
    } catch (err) {
      console.error('Failed to acknowledge anomaly:', err);
    }
  };

  const filtered = filterSeverity === 'ALL'
    ? anomalies
    : anomalies.filter((a) => a.severity === filterSeverity);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-graphite-800/80 pb-4">
        <div>
          <h1 className="font-mono text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
            ANOMALY DETECTION & RESIDUAL MONITOR
          </h1>
          <p className="text-xs font-mono text-graphite-400 mt-1">
            Hybrid rolling z-score & IsolationForest detection engine for irregular energy spikes
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center space-x-1.5 bg-graphite-900 px-3 py-1.5 rounded-lg border border-graphite-800 text-xs font-mono">
          <Filter className="w-3.5 h-3.5 text-graphite-400" />
          <span className="text-graphite-400">Severity:</span>
          {['ALL', 'HIGH', 'UNUSUAL', 'NORMAL'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2 py-0.5 rounded uppercase text-[10px] font-bold transition-colors ${
                filterSeverity === sev
                  ? 'bg-rose-500 text-white'
                  : 'text-graphite-400 hover:text-white'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Main Anomaly Timeline Scatter */}
      <AnomalyTimelineChart anomalies={anomalies} />

      {/* Anomaly Log Table */}
      <GlassCard glow="rose" className="p-4">
        <div className="flex items-center justify-between border-b border-graphite-800 pb-2 mb-3">
          <h3 className="font-mono text-xs font-semibold text-graphite-200 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            Detected Anomaly Incident Stream ({filtered.length} Events)
          </h3>
          <span className="font-mono text-[10px] text-teal-400">
            {acknowledgedTimestamps.size} Resolved Incidents
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-graphite-800 text-graphite-400 text-[10px] uppercase">
                <th className="py-2.5 px-3">Timestamp ISO</th>
                <th className="py-2.5 px-3">Observed kW</th>
                <th className="py-2.5 px-3">Expected kW</th>
                <th className="py-2.5 px-3">Deviation kW</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Detection Method</th>
                <th className="py-2.5 px-3 text-right">Action / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-graphite-800/60">
              {filtered.length > 0 ? (
                filtered.map((row, i) => {
                  const isAck = acknowledgedTimestamps.has(row.timestamp);
                  return (
                    <tr key={i} className={`hover:bg-graphite-900/60 transition-colors ${isAck ? 'opacity-50 bg-graphite-950/40' : ''}`}>
                      <td className="py-2.5 px-3 text-graphite-300">{new Date(row.timestamp).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-rose-400 font-bold">{row.observed_value.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-graphite-400">{row.expected_value.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-amber-300 font-semibold">
                        {row.difference > 0 ? `+${row.difference.toFixed(2)}` : row.difference.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          row.severity === 'HIGH'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}>
                          {row.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-graphite-400">{row.method}</td>
                      <td className="py-2.5 px-3 text-right">
                        {isAck ? (
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center justify-end space-x-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Acknowledged</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAcknowledge(row.timestamp)}
                            className="px-2 py-1 rounded bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-[10px] font-mono transition-colors"
                          >
                            Acknowledge
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-graphite-400">
                    No anomalies match the selected severity filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

    </div>
  );
}
