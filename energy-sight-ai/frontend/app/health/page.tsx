'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { CsvUploaderModal } from '@/components/CsvUploaderModal';
import { 
  Database, 
  CheckCircle2, 
  Layers, 
  Activity, 
  HardDrive, 
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Upload
} from 'lucide-react';
import { api, DataSummary } from '@/lib/api';

function QualityBar({ score }: { score: number }) {
  const color = score >= 90 ? 'bg-emerald-500' : score >= 70 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="w-full h-1.5 bg-graphite-800 rounded-full overflow-hidden mt-1">
      <div
        className={`h-full ${color} rounded-full transition-all duration-700`}
        style={{ width: `${Math.min(100, score)}%` }}
      />
    </div>
  );
}

export default function DataHealthPage() {
  const [summary, setSummary] = useState<DataSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDataSummary();
      setSummary(res);
    } catch (err) {
      console.error('Failed to fetch data summary:', err);
      setError('Backend connection failed. Start the FastAPI server on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const numRows = summary?.total_rows ?? summary?.num_rows ?? 8760;
  const qualityScore = summary?.quality_score ?? 100;
  const isDemo = summary?.is_demo ?? true;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-graphite-800/80 pb-4">
        <div>
          <h1 className="font-mono text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-teal-400" />
            DATA HEALTH & PIPELINE INTEGRITY
          </h1>
          <p className="text-xs font-mono text-graphite-400 mt-1">
            Dataset metadata, validation pipeline audit, missing value checks, and chronological split boundaries
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-teal-500 text-graphite-950 hover:bg-teal-400 font-mono text-xs font-bold transition-all shadow-md"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Energy CSV</span>
          </button>
          <button
            onClick={fetchSummary}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-graphite-900 border border-graphite-700 text-graphite-200 hover:text-white hover:bg-graphite-800 text-xs font-mono transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <CsvUploaderModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={fetchSummary}
      />

      {/* Demo Banner */}
      {isDemo && (
        <div className="px-4 py-2.5 rounded-lg bg-amber-950/40 border border-amber-800/50 text-amber-300 font-mono text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>Running on <strong>demo synthetic dataset</strong>. Upload real consumption CSV via Settings to use your data.</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 font-mono text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Dataset Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <GlassCard glow="teal" className="p-4">
          <div className="text-graphite-400 font-mono text-xs uppercase">Total Timesteps</div>
          <div className="font-mono font-bold text-2xl text-white mt-1">
            {loading ? '—' : numRows.toLocaleString()}
          </div>
          <p className="text-[10px] font-mono text-graphite-400 mt-1">
            {summary?.frequency ?? 'Hourly'} resolution
          </p>
        </GlassCard>

        <GlassCard glow="cyan" className="p-4">
          <div className="text-graphite-400 font-mono text-xs uppercase">Missing Values</div>
          <div className={`font-mono font-bold text-2xl mt-1 ${(summary?.missing_values ?? 0) === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {loading ? '—' : `${summary?.missing_values ?? 0} (${(summary?.missing_pct ?? 0).toFixed(2)}%)`}
          </div>
          <p className="text-[10px] font-mono text-graphite-400 mt-1">Validated & forward-filled</p>
        </GlassCard>

        <GlassCard glow="amber" className="p-4">
          <div className="text-graphite-400 font-mono text-xs uppercase">Coverage</div>
          <div className="font-mono font-bold text-xl text-amber-300 mt-1">
            {loading ? '—' : `${summary?.date_range_days ?? 365} Days`}
          </div>
          <p className="text-[10px] font-mono text-graphite-400 mt-1">Full seasonal cycle</p>
        </GlassCard>

        <GlassCard glow="teal" className="p-4">
          <div className="text-graphite-400 font-mono text-xs uppercase">Data Quality</div>
          <div className={`font-mono font-bold text-2xl mt-1 ${qualityScore >= 90 ? 'text-emerald-400' : qualityScore >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>
            {loading ? '—' : `${qualityScore.toFixed(0)}%`}
          </div>
          <QualityBar score={qualityScore} />
        </GlassCard>

      </div>

      {/* Statistics Row */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard glow="none" className="p-4">
            <h3 className="font-mono text-xs font-semibold text-graphite-200 uppercase tracking-wider mb-3 border-b border-graphite-800 pb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              Consumption Statistics
            </h3>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-graphite-400">Mean:</span>
                <span className="text-teal-300 font-bold">{(summary.mean_consumption ?? 0).toFixed(3)} kWh/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-graphite-400">Min:</span>
                <span className="text-cyan-300">{(summary.min_consumption ?? 0).toFixed(3)} kWh/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-graphite-400">Max:</span>
                <span className="text-amber-300">{(summary.max_consumption ?? 0).toFixed(3)} kWh/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-graphite-400">Std Dev:</span>
                <span className="text-graphite-200">{(summary.std_consumption ?? 0).toFixed(3)} kWh/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-graphite-400">Outliers:</span>
                <span className={(summary.outlier_count ?? 0) > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                  {summary.outlier_count ?? 0} ({(summary.outlier_pct ?? 0).toFixed(2)}%)
                </span>
              </div>
            </div>
          </GlassCard>

          <GlassCard glow="none" className="p-4">
            <h3 className="font-mono text-xs font-semibold text-graphite-200 uppercase tracking-wider mb-3 border-b border-graphite-800 pb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Preprocessing Audit Log
            </h3>
            <div className="space-y-2.5 font-mono text-xs">
              {[
                { step: '1. DateTime Index Parsing', detail: 'Converted raw strings to UTC timestamp index' },
                { step: '2. Resampling & Frequency Enforcement', detail: "Enforced strict '1h' hourly sampling grid" },
                { step: '3. Lag & Rolling Feature Engineering', detail: 'lag_1, lag_24, lag_168, rolling 24h & 168h means' },
                { step: '4. Outlier Detection & Capping', detail: 'IQR-based bounds with soft capping' },
              ].map((item) => (
                <div key={item.step} className="p-2 rounded bg-graphite-950 border border-graphite-800 flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white">{item.step}</div>
                    <div className="text-[10px] text-graphite-400 mt-0.5">{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard glow="none" className="p-4">
            <h3 className="font-mono text-xs font-semibold text-graphite-200 uppercase tracking-wider mb-3 border-b border-graphite-800 pb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-400" />
              Chronological Split Boundaries
            </h3>
            <div className="space-y-2.5 font-mono text-xs">
              {[
                { label: 'Training Set (70%)', hours: Math.round(numRows * 0.7), color: 'text-teal-300' },
                { label: 'Validation Set (15%)', hours: Math.round(numRows * 0.15), color: 'text-cyan-300' },
                { label: 'Test Set (15%)', hours: Math.round(numRows * 0.15), color: 'text-amber-300' },
              ].map((split) => (
                <div key={split.label} className="p-2.5 rounded bg-graphite-950 border border-graphite-800">
                  <div className={`flex justify-between font-semibold ${split.color}`}>
                    <span>{split.label}</span>
                    <span>{split.hours.toLocaleString()} hours</span>
                  </div>
                  <div className="w-full h-1 bg-graphite-800 rounded-full mt-1.5">
                    <div
                      className={`h-full rounded-full ${split.color === 'text-teal-300' ? 'bg-teal-500' : split.color === 'text-cyan-300' ? 'bg-cyan-500' : 'bg-amber-500'}`}
                      style={{ width: split.color === 'text-teal-300' ? '70%' : '15%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Issues List */}
      {summary?.issues && summary.issues.length > 0 && (
        <GlassCard glow="none" className="p-4">
          <h3 className="font-mono text-xs font-semibold text-amber-300 uppercase tracking-wider mb-3 border-b border-graphite-800 pb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Data Quality Issues ({summary.issues.length})
          </h3>
          <div className="space-y-1.5">
            {summary.issues.map((issue, i) => (
              <div key={i} className="flex items-center space-x-2 text-xs font-mono text-amber-300/80">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>{issue}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

    </div>
  );
}
