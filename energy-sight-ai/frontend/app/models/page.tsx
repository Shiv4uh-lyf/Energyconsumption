'use client';

import React, { useState, useEffect } from 'react';
import { ModelComparisonChart } from '@/components/charts/ModelComparisonChart';
import { FeatureImportanceChart } from '@/components/charts/FeatureImportanceChart';
import { GlassCard } from '@/components/GlassCard';
import { 
  BarChart3, 
  Award, 
  Cpu, 
  Zap, 
  TrendingUp, 
  Sparkles,
  Info,
  Check
} from 'lucide-react';
import { api } from '@/lib/api';

export default function ModelArenaPage() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [explainability, setExplainability] = useState<any[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'mae' | 'rmse' | 'mape' | 'r2'>('mae');
  const [selectedModelForFeature, setSelectedModelForFeature] = useState<string>('xgboost');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadEvaluation = async () => {
      setLoading(true);
      try {
        const evalRes = await api.getEvaluation();
        // Normalize metrics: ensure latency_ms field exists
        const metrics = (evalRes.metrics ?? []).map((m: any) => ({
          ...m,
          latency_ms: m.latency_ms ?? m.inference_time_ms ?? 0,
          mape: m.mape ?? 0,
        }));
        setMetrics(metrics);

        const expRes = await api.getExplainability(selectedModelForFeature);
        // api.ts normalizes to `features`; fall back to feature_importance
        setExplainability(expRes.features ?? expRes.feature_importance ?? []);
      } catch (err) {
        console.error('Failed to fetch evaluation metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    loadEvaluation();
  }, [selectedModelForFeature]);

  // Determine top-performing model
  const topModel = metrics.length > 0 ? [...metrics].sort((a, b) => a.mae - b.mae)[0] : null;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-graphite-800/80 pb-4">
        <div>
          <h1 className="font-mono text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            MODEL ARENA BENCHMARK LABORATORY
          </h1>
          <p className="text-xs font-mono text-graphite-400 mt-1">
            Empirical evaluation & head-to-head comparison of 5 ML forecasting models on out-of-sample test set
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center space-x-1 bg-graphite-900 p-1 rounded-lg border border-graphite-800 text-xs font-mono">
          {(['mae', 'rmse', 'mape', 'r2'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMetric(m)}
              className={`px-3 py-1 rounded transition-colors uppercase font-bold ${
                selectedMetric === m
                  ? 'bg-emerald-500 text-graphite-950 shadow-md'
                  : 'text-graphite-400 hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Champion Model Highlight Banner */}
      {topModel && (
        <GlassCard glow="teal" className="p-4 bg-gradient-to-r from-emerald-950/40 via-graphite-900 to-graphite-950 border-emerald-500/40">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Award className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
                    Arena Champion
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    Rank #1
                  </span>
                </div>
                <h2 className="font-mono text-lg font-bold text-white mt-0.5">
                  {topModel.model_name} Model Engine
                </h2>
              </div>
            </div>

            <div className="flex items-center space-x-6 font-mono text-xs">
              <div>
                <div className="text-graphite-400 text-[10px]">MAE (Error)</div>
                <div className="text-emerald-400 font-bold text-base">{topModel.mae?.toFixed(2) ?? '—'} kW</div>
              </div>
              <div>
                <div className="text-graphite-400 text-[10px]">R² Variance</div>
                <div className="text-teal-300 font-bold text-base">{topModel.r2?.toFixed(3) ?? '—'}</div>
              </div>
              <div>
                <div className="text-graphite-400 text-[10px]">Latency</div>
                <div className="text-cyan-300 font-bold text-base">{topModel.latency_ms?.toFixed(1) ?? '—'} ms</div>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Grid Row: Model Comparison Chart & Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModelComparisonChart metrics={metrics} selectedMetric={selectedMetric} />
        <FeatureImportanceChart features={explainability} modelName={selectedModelForFeature} />
      </div>

      {/* Leaderboard Table */}
      <GlassCard glow="none" className="p-4">
        <div className="flex items-center justify-between border-b border-graphite-800 pb-2 mb-3">
          <h3 className="font-mono text-xs font-semibold text-graphite-200 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            Model Leaderboard & Out-Of-Sample Test Evaluation
          </h3>
          <span className="font-mono text-[10px] text-graphite-400">
            Chronological Split Test Set
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-graphite-800 text-graphite-400 text-[10px] uppercase">
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3">Model Architecture</th>
                <th className="py-2.5 px-3">MAE (kW)</th>
                <th className="py-2.5 px-3">RMSE (kW)</th>
                <th className="py-2.5 px-3">MAPE (%)</th>
                <th className="py-2.5 px-3">R² Score</th>
                <th className="py-2.5 px-3 text-right">Inference Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-graphite-800/60">
              {metrics.map((row, i) => (
                <tr
                  key={i}
                  className={`hover:bg-graphite-900/60 transition-colors ${
                    i === 0 ? 'bg-emerald-950/20 font-semibold' : ''
                  }`}
                >
                  <td className="py-2.5 px-3">
                    <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold ${
                      i === 0 ? 'bg-emerald-500 text-graphite-950' : 'bg-graphite-800 text-graphite-300'
                    }`}>
                      #{i + 1}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-white flex items-center space-x-2">
                    <span>{row.model_name}</span>
                    {i === 0 && <span className="text-[10px] text-emerald-400 font-bold">(BEST)</span>}
                  </td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">{row.mae?.toFixed(2) ?? '—'}</td>
                  <td className="py-2.5 px-3 text-teal-300">{row.rmse?.toFixed(2) ?? '—'}</td>
                  <td className="py-2.5 px-3 text-cyan-300">{row.mape != null ? `${row.mape.toFixed(2)}%` : '—'}</td>
                  <td className="py-2.5 px-3 text-amber-300">{row.r2?.toFixed(3) ?? '—'}</td>
                  <td className="py-2.5 px-3 text-right text-graphite-400">{row.latency_ms?.toFixed(1) ?? '—'} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

    </div>
  );
}
