'use client';

import React, { useState, useEffect } from 'react';
import { HeroEnergyWave } from '@/components/3d/HeroEnergyWave';
import { SpatialKPIs } from '@/components/SpatialKPIs';
import { GlassCard } from '@/components/GlassCard';
import { ForecastChart } from '@/components/charts/ForecastChart';
import { 
  Zap, 
  BrainCircuit, 
  AlertTriangle, 
  Activity, 
  Layers, 
  ArrowRight,
  Sparkles,
  RefreshCw,
  Clock
} from 'lucide-react';
import { api, Insight } from '@/lib/api';

import { DemandResponseSimulator } from '@/components/DemandResponseSimulator';
import { ExecutiveReportModal } from '@/components/ExecutiveReportModal';
import { Sliders, FileText, Download } from 'lucide-react';

export default function OverviewPage() {
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [selectedModel, setSelectedModel] = useState<string>('Ensemble');
  const [horizon, setHorizon] = useState<number>(24);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch forecast data from real backend
      const fcRes = await api.getForecast({ model_name: selectedModel, horizon_hours: horizon });
      setData(fcRes.forecast);

      // Fetch summary stats
      const sumRes = await api.getSummary();
      setSummary(sumRes);

      // Fetch AI Analyst insights
      const insRes = await api.getInsights();
      // insights may be Insight[] objects or string[] — normalize
      const rawInsights = insRes.insights ?? [];
      const normalized = rawInsights.map((item: any, idx: number) =>
        typeof item === 'string'
          ? { id: `i${idx}`, category: 'Analysis', icon: 'sparkles', severity: 'info', title: item, detail: '', value: '', unit: '' }
          : item
      );
      setInsights(normalized);

      // Fetch Recent Anomalies
      const anomRes = await api.getAnomalies(100);
      setAnomalies(anomRes.anomalies);

      // Fetch Model Evaluations for Executive Report
      try {
        const evalRes = await api.getEvaluation();
        setEvaluation(evalRes);
      } catch {
        // non-blocking
      }
    } catch (err: any) {
      console.error('Failed to load overview data:', err);
      setError('Could not connect to FastAPI backend. Ensure backend server is running on localhost:8000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedModel, horizon]);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-graphite-800/80 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-mono text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-teal-400 animate-pulse" />
              ENERGY COMMAND CENTER
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-teal-500/10 text-teal-300 border border-teal-500/30">
              REAL ML INFERENCE
            </span>
          </div>
          <p className="text-xs font-mono text-graphite-400 mt-1">
            Real-time grid consumption telemetry, neural ensemble predictions & anomaly intelligence
          </p>
        </div>

        {/* Model & Horizon Selector Controls + Export Button */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-mono font-bold transition-all shadow-md"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Executive Audit</span>
          </button>

          <div className="flex items-center space-x-1.5 bg-graphite-900 px-3 py-1.5 rounded-lg border border-graphite-800 text-xs font-mono">
            <span className="text-graphite-400">Horizon:</span>
            {[24, 48, 72].map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`px-2 py-0.5 rounded transition-all ${
                  horizon === h
                    ? 'bg-teal-500 text-graphite-950 font-bold'
                    : 'text-graphite-300 hover:bg-graphite-800'
                }`}
              >
                {h}h
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-1.5 bg-graphite-900 px-3 py-1.5 rounded-lg border border-graphite-800 text-xs font-mono">
            <span className="text-graphite-400">Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-graphite-950 text-cyan-300 font-semibold rounded px-2 py-0.5 border border-graphite-700 focus:outline-none focus:border-teal-500"
            >
              <option value="Ensemble">Ensemble (Best Accuracy)</option>
              <option value="xgboost">XGBoost Regressor</option>
              <option value="random_forest">Random Forest</option>
              <option value="linear_regression">Ridge Linear Regression</option>
              <option value="sarima">SARIMA Seasonal</option>
            </select>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border border-teal-500/40 text-xs font-mono transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 font-mono text-xs flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <p className="font-semibold">Backend Connection Alert</p>
            <p className="text-[11px] text-rose-400/90">{error}</p>
          </div>
        </div>
      )}

      {/* Spatial KPI Cards */}
      <SpatialKPIs
        currentLoad={summary?.latest_reading ?? 482.5}
        todayTotal={summary?.total_24h_kwh ?? 11450.8}
        forecastPeak={summary?.peak_24h ?? 540.2}
        forecastPeakTime="18:00"
        trendPct={3.4}
        anomalyCount={anomalies.length}
        anomalySeverity={anomalies.length > 2 ? 'HIGH' : anomalies.length > 0 ? 'UNUSUAL' : 'NORMAL'}
      />

      {/* 3D Hero Surface Wave */}
      <HeroEnergyWave
        data={data}
        selectedModel={selectedModel}
        horizon={horizon}
        onRefresh={loadData}
      />

      {/* Grid Row: Detailed Chart & Insights Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Main Forecast Chart */}
        <div className="lg:col-span-2 space-y-4">
          <ForecastChart
            data={data}
            title={`Forecast Timeline (${selectedModel}) — Next ${horizon} Hours`}
            height={340}
          />
        </div>

        {/* Right 1 Col: AI Insights & Anomaly Intelligence */}
        <div className="space-y-4">
          
          {/* AI Insights Engine Card */}
          <GlassCard glow="teal" className="p-4">
            <div className="flex items-center space-x-2 border-b border-graphite-800 pb-2 mb-3">
              <BrainCircuit className="w-4 h-4 text-teal-400" />
              <h3 className="font-mono text-xs font-semibold text-graphite-200 uppercase tracking-wider">
                AI Energy Analyst Insights
              </h3>
            </div>
            
            <div className="space-y-2.5">
              {insights.length > 0 ? (
                insights.slice(0, 4).map((ins, idx) => (
                  <div
                    key={ins.id ?? idx}
                    className="p-2.5 rounded-lg bg-graphite-950/80 border border-graphite-800 text-xs font-mono text-graphite-300 flex items-start space-x-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                    <span>{ins.title}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs font-mono text-graphite-400 italic">
                  Analyzing load data stream...
                </div>
              )}
            </div>
          </GlassCard>

          {/* Recent Anomalies Card */}
          <GlassCard glow="rose" className="p-4">
            <div className="flex items-center justify-between border-b border-graphite-800 pb-2 mb-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h3 className="font-mono text-xs font-semibold text-graphite-200 uppercase tracking-wider">
                  Anomaly Monitor Stream
                </h3>
              </div>
              <span className="font-mono text-[10px] text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                {anomalies.length} ALERTS
              </span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
              {anomalies.length > 0 ? (
                anomalies.map((anom, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg border text-xs font-mono flex items-center justify-between ${
                      anom.severity === 'HIGH'
                        ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                        : 'bg-amber-950/30 border-amber-800/50 text-amber-300'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{anom.observed_value.toFixed(1)} kW (Observed)</div>
                      <div className="text-[10px] text-graphite-400">
                        Baseline: {anom.expected_value.toFixed(1)} kW | Dev: {anom.difference > 0 ? '+' : ''}{anom.difference.toFixed(1)} kW
                      </div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-graphite-900 border border-graphite-700">
                      {anom.severity}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs font-mono text-emerald-400 bg-emerald-950/20 p-3 rounded border border-emerald-800/40 text-center">
                  ✓ Consumption matches expected normal baseline
                </div>
              )}
            </div>
          </GlassCard>

        </div>

      </div>

      {/* Demand-Response What-If Simulator Section */}
      <DemandResponseSimulator
        forecastData={data}
        baseCarbonIntensity={410}
        electricityRate={0.14}
      />

      {/* Executive PDF & CSV Audit Report Export Modal */}
      <ExecutiveReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        summary={summary}
        evaluation={evaluation}
        anomalies={anomalies}
        forecastData={data}
      />

    </div>
  );
}
