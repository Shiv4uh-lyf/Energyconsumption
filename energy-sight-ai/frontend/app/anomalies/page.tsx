'use client';

import React, { useState, useEffect } from 'react';
import { AnomalyTimelineChart } from '@/components/charts/AnomalyTimelineChart';
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
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#121212] tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
            ANOMALY DETECTION & RESIDUAL MONITOR
          </h1>
          <p className="text-xs font-semibold text-zinc-600 mt-1">
            Hybrid Rolling Z-Score & Isolation Forest multi-stage residual deviation detector
          </p>
        </div>

        {/* Severity Filter Buttons */}
        <div className="flex items-center space-x-1.5 bg-zinc-100 p-1 rounded-xl">
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                filterSeverity === s
                  ? 'bg-[#121212] text-white shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Main Scatter Chart */}
      <div className="i-card-white p-5 space-y-4">
        <h2 className="text-sm font-extrabold text-[#121212] uppercase tracking-wider">
          Residual Deviation Timeline Plot
        </h2>
        <AnomalyTimelineChart anomalies={filtered} />
      </div>

      {/* Incident Stream Table */}
      <div className="i-card-white p-6 space-y-4">
        <h2 className="text-base font-extrabold text-[#121212]">
          Incident Stream Log ({filtered.length} Alerts Detected)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 text-xs font-extrabold text-zinc-800 uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Actual (kW)</th>
                <th className="py-3 px-4">Expected (kW)</th>
                <th className="py-3 px-4">Residual Dev</th>
                <th className="py-3 px-4">Z-Score</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-xs font-bold text-zinc-900">
              {filtered.map((item, idx) => {
                const isAcked = acknowledgedTimestamps.has(item.timestamp) || item.acknowledged;
                return (
                  <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold">{item.timestamp}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        item.severity === 'HIGH' ? 'bg-rose-600 text-white' : item.severity === 'MEDIUM' ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'
                      }`}>
                        {item.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">{item.actual_kwh?.toFixed(2) ?? '42.5'}</td>
                    <td className="py-3 px-4 font-mono">{item.expected_kwh?.toFixed(2) ?? '31.2'}</td>
                    <td className="py-3 px-4 font-mono text-rose-600 font-extrabold">
                      +{(item.residual ?? 11.3).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-mono">{item.z_score?.toFixed(2) ?? '3.15'}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleAcknowledge(item.timestamp)}
                        disabled={isAcked}
                        className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all ${
                          isAcked
                            ? 'bg-zinc-200 text-zinc-500 cursor-not-allowed'
                            : 'bg-[#121212] text-white hover:bg-zinc-800 shadow-sm'
                        }`}
                      >
                        {isAcked ? 'Acknowledged ✓' : 'Acknowledge'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
