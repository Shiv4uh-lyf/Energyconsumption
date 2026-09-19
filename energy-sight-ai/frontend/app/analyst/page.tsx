'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { 
  BrainCircuit, 
  Sparkles, 
  Cpu, 
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Calendar,
  Database,
  Activity,
  RefreshCw,
  Info
} from 'lucide-react';
import { api, Insight } from '@/lib/api';

const ICON_MAP: Record<string, React.ElementType> = {
  zap: Zap,
  calendar: Calendar,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'alert-triangle': AlertTriangle,
  'check-circle': CheckCircle2,
  activity: Activity,
  database: Database,
  sparkles: Sparkles,
  cpu: Cpu,
  info: Info,
};

const SEVERITY_STYLE: Record<string, { border: string; bg: string; badge: string; iconColor: string; valueColor: string }> = {
  info: {
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-950/20',
    badge: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
    iconColor: 'text-cyan-400',
    valueColor: 'text-cyan-300',
  },
  success: {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-950/20',
    badge: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    iconColor: 'text-emerald-400',
    valueColor: 'text-emerald-300',
  },
  warning: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-950/20',
    badge: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    iconColor: 'text-amber-400',
    valueColor: 'text-amber-300',
  },
  error: {
    border: 'border-rose-500/30',
    bg: 'bg-rose-950/20',
    badge: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
    iconColor: 'text-rose-400',
    valueColor: 'text-rose-300',
  },
};

export default function AIAnalystPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [generatedAt, setGeneratedAt] = useState<string>('');
  const [dataPoints, setDataPoints] = useState<number>(0);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await api.getInsights();
      // Handle both {insights: Insight[]} and {insights: string[]} shapes
      const rawInsights = res.insights ?? [];
      const normalized: Insight[] = rawInsights.map((item: any, idx: number) => {
        if (typeof item === 'string') {
          return {
            id: `insight_${idx}`,
            category: 'Analysis',
            icon: 'sparkles',
            severity: 'info',
            title: item,
            detail: '',
            value: '',
            unit: '',
          };
        }
        return item as Insight;
      });
      setInsights(normalized);
      setGeneratedAt(res.generated_at ?? '');
      setDataPoints(res.data_points_analyzed ?? 0);
    } catch (err) {
      console.error('Failed to fetch insights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-graphite-800/80 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-mono text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <BrainCircuit className="w-6 h-6 text-teal-400" />
              AI ENERGY ANALYST ENGINE
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-teal-500/10 text-teal-300 border border-teal-500/30">
              DETERMINISTIC + LLM READY
            </span>
          </div>
          <p className="text-xs font-mono text-graphite-400 mt-1">
            Automated rule & statistical inference engine generating natural-language grid operational intelligence
          </p>
        </div>

        <button
          onClick={fetchInsights}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border border-teal-500/40 text-xs font-mono transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {/* Engine Status Banner */}
      <GlassCard glow="teal" className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono text-sm font-bold text-white">
                Deterministic Statistical Inference Engine Active
              </h3>
              <p className="font-mono text-xs text-graphite-400">
                Zero-hallucination insights computed directly from model telemetry & residual distributions
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4 font-mono text-xs">
            {dataPoints > 0 && (
              <div className="text-right">
                <div className="text-graphite-400 text-[10px] uppercase">Data Points Analyzed</div>
                <div className="text-teal-300 font-bold">{dataPoints.toLocaleString()}</div>
              </div>
            )}
            <span className="px-3 py-1 text-xs font-mono rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
              ✓ Operational
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 rounded-xl bg-graphite-900/60 border border-graphite-800 animate-pulse" />
          ))}
        </div>
      )}

      {/* Generated Insights Grid */}
      {!loading && insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, idx) => {
            const IconComp = ICON_MAP[insight.icon] ?? Sparkles;
            const style = SEVERITY_STYLE[insight.severity] ?? SEVERITY_STYLE.info;
            return (
              <GlassCard
                key={insight.id ?? idx}
                glow="none"
                className={`p-4 space-y-3 border ${style.border} ${style.bg}`}
              >
                {/* Top row: category + severity badge */}
                <div className="flex items-center justify-between">
                  <div className={`flex items-center space-x-2 ${style.iconColor}`}>
                    <IconComp className="w-4 h-4" />
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                      {insight.category}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${style.badge}`}>
                    {insight.severity}
                  </span>
                </div>

                {/* Title */}
                <p className="font-mono text-sm font-semibold text-white leading-snug">
                  {insight.title}
                </p>

                {/* Detail */}
                {insight.detail && (
                  <p className="font-mono text-[11px] text-graphite-300 leading-relaxed">
                    {insight.detail}
                  </p>
                )}

                {/* Value chip */}
                {insight.value !== '' && insight.value !== undefined && (
                  <div className="pt-2 border-t border-graphite-800/80 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-graphite-400 uppercase">Measured Value</span>
                    <span className={`font-mono text-sm font-bold ${style.valueColor}`}>
                      {typeof insight.value === 'number' ? insight.value.toFixed(2) : insight.value}
                      {insight.unit ? ` ${insight.unit}` : ''}
                    </span>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && insights.length === 0 && (
        <GlassCard glow="none" className="p-10 text-center">
          <BrainCircuit className="w-10 h-10 text-graphite-600 mx-auto mb-3" />
          <p className="font-mono text-sm text-graphite-400">
            No insights available. Ensure the backend is running and data is loaded.
          </p>
        </GlassCard>
      )}

      {/* Generated timestamp */}
      {generatedAt && (
        <p className="text-center font-mono text-[10px] text-graphite-500">
          Analysis generated at {new Date(generatedAt).toLocaleString()} · {insights.length} insights
        </p>
      )}

    </div>
  );
}
