'use client';

import React, { useState, useEffect } from 'react';
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

export default function AIAnalystPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await api.getInsights();
      const raw = res.insights ?? [];
      const normalized = raw.map((item: any, idx: number) =>
        typeof item === 'string'
          ? { id: `i${idx}`, category: 'Analysis', icon: 'sparkles', severity: 'info', title: item, detail: '', value: '', unit: '' }
          : item
      );
      setInsights(normalized);
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
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#121212] tracking-tight flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-zinc-900" />
            ZERO-HALLUCINATION AI STATISTICAL ANALYST
          </h1>
          <p className="text-xs font-semibold text-zinc-600 mt-1">
            Autonomous statistical moment analysis & rule-based executive insights
          </p>
        </div>

        <button
          onClick={fetchInsights}
          className="i-btn-black px-4 py-2 flex items-center space-x-2 shadow-sm text-xs"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Regenerate Insights</span>
        </button>
      </div>

      {/* Insights Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {insights.map((item, idx) => {
          const IconComponent = ICON_MAP[item.icon?.toLowerCase()] || Sparkles;

          return (
            <div
              key={item.id || idx}
              className="i-card-white p-6 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-zinc-900 text-white">
                  {item.category || 'STATISTICAL RULE'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-[#121212]">
                  <IconComponent className="w-4 h-4" />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-[#121212] leading-snug">
                  {item.title}
                </h3>
                {item.detail && (
                  <p className="text-xs font-semibold text-zinc-600 mt-2 leading-relaxed">
                    {item.detail}
                  </p>
                )}
              </div>

              {item.value && (
                <div className="pt-3 border-t border-zinc-200 flex items-baseline space-x-1">
                  <span className="text-2xl font-extrabold text-[#121212]">
                    {item.value}
                  </span>
                  {item.unit && (
                    <span className="text-xs font-bold text-zinc-500">
                      {item.unit}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
