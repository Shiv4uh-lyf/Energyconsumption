'use client';

import React, { useState, useEffect } from 'react';
import { ForecastChart } from '@/components/charts/ForecastChart';
import { GlassCard } from '@/components/GlassCard';
import { 
  TrendingUp, 
  Sliders, 
  CheckCircle2, 
  Clock, 
  Zap, 
  BarChart2, 
  Download,
  AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';

export default function ForecastStudioPage() {
  const [model, setModel] = useState<string>('Ensemble');
  const [horizon, setHorizon] = useState<number>(24);
  const [showCI, setShowCI] = useState<boolean>(true);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getForecast({ model_name: model, horizon_hours: horizon });
      setForecastData(res.forecast);

      // Fetch model metrics
      const evalRes = await api.getEvaluation();
      const match = evalRes.metrics.find((m: any) => m.model_name.toLowerCase() === model.toLowerCase() || (model === 'Ensemble' && m.model_name === 'Ensemble'));
      setMetrics(match || evalRes.metrics[0]);
    } catch (err: any) {
      setError('Failed to fetch forecast from model backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [model, horizon]);

  // Compute forecast stats
  const predictedVals = forecastData.map((f) => f.predicted ?? 0).filter((v) => v > 0);
  const maxPeak = predictedVals.length > 0 ? Math.max(...predictedVals) : 0;
  const avgLoad = predictedVals.length > 0 ? predictedVals.reduce((a, b) => a + b, 0) / predictedVals.length : 0;
  const totalKWh = predictedVals.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-graphite-800/80 pb-4">
        <div>
          <h1 className="font-mono text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-cyan-400" />
            FORECAST STUDIO WORKSTATION
          </h1>
          <p className="text-xs font-mono text-graphite-400 mt-1">
            Configure, simulate, and export multi-horizon time-series forecasting experiments
          </p>
        </div>

        <button
          onClick={() => {
            const csv = 'timestamp,predicted,lower_ci,upper_ci\n' + forecastData.map(d => `${d.timestamp},${d.predicted},${d.lower_ci},${d.upper_ci}`).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `forecast_${model}_${horizon}h.csv`;
            a.click();
          }}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-graphite-900 border border-graphite-700 text-graphite-200 hover:text-white hover:bg-graphite-800 text-xs font-mono transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-teal-400" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Main 3-Column Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (3 cols): Control Panel */}
        <div className="lg:col-span-3 space-y-4">
          <GlassCard glow="cyan" className="p-4 space-y-4">
            <div className="flex items-center space-x-2 border-b border-graphite-800 pb-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h3 className="font-mono text-xs font-semibold text-graphite-200 uppercase tracking-wider">
                Inference Controls
              </h3>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-[11px] font-mono text-graphite-400 mb-1">
                Forecasting Model Engine
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-graphite-950 text-xs font-mono text-cyan-300 rounded-lg p-2 border border-graphite-700 focus:outline-none focus:border-cyan-500"
              >
                <option value="Ensemble">Weighted Ensemble (XGB+RF+LR)</option>
                <option value="xgboost">XGBoost Regressor</option>
                <option value="random_forest">Random Forest Regressor</option>
                <option value="linear_regression">Ridge Linear Regression</option>
                <option value="sarima">SARIMA Seasonal Model</option>
              </select>
            </div>

            {/* Horizon Selection */}
            <div>
              <label className="block text-[11px] font-mono text-graphite-400 mb-1">
                Forecast Horizon (Hours)
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[12, 24, 48, 72].map((h) => (
                  <button
                    key={h}
                    onClick={() => setHorizon(h)}
                    className={`py-1.5 rounded text-xs font-mono font-semibold transition-colors ${
                      horizon === h
                        ? 'bg-cyan-500 text-graphite-950'
                        : 'bg-graphite-950 text-graphite-300 hover:bg-graphite-800 border border-graphite-800'
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle CI Bands */}
            <div className="pt-2 border-t border-graphite-800 flex items-center justify-between">
              <span className="text-xs font-mono text-graphite-300">
                Show 95% Confidence Band
              </span>
              <button
                onClick={() => setShowCI(!showCI)}
                className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${
                  showCI ? 'bg-teal-500 justify-end' : 'bg-graphite-800 justify-start'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white shadow-md" />
              </button>
            </div>

            {/* Model Status Note */}
            <div className="p-3 rounded-lg bg-graphite-950 border border-graphite-800/80 text-[11px] font-mono text-graphite-400 space-y-1">
              <div className="text-teal-400 font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Model Artifact Ready</span>
              </div>
              <p className="text-[10px] text-graphite-400">
                Using trained artifact joblib model with 24h lag & 7-day rolling statistics features.
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Center Column (6 cols): Primary Studio Chart */}
        <div className="lg:col-span-6 space-y-4">
          <ForecastChart
            data={forecastData}
            title={`${model.toUpperCase()} Forecast Curve (${horizon} Hours Ahead)`}
            height={380}
            showCI={showCI}
          />
        </div>

        {/* Right Column (3 cols): Prediction Intelligence */}
        <div className="lg:col-span-3 space-y-4">
          <GlassCard glow="amber" className="p-4 space-y-4">
            <div className="flex items-center space-x-2 border-b border-graphite-800 pb-2">
              <BarChart2 className="w-4 h-4 text-amber-400" />
              <h3 className="font-mono text-xs font-semibold text-graphite-200 uppercase tracking-wider">
                Prediction Metrics
              </h3>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-graphite-950 border border-graphite-800">
                <div className="text-graphite-400 text-[10px] uppercase">Predicted Peak Load</div>
                <div className="text-xl font-bold text-amber-300 mt-0.5">{maxPeak.toFixed(1)} kW</div>
                <div className="text-[10px] text-graphite-400 mt-0.5">Maximum demand in {horizon}h window</div>
              </div>

              <div className="p-2.5 rounded-lg bg-graphite-950 border border-graphite-800">
                <div className="text-graphite-400 text-[10px] uppercase">Average Load Rate</div>
                <div className="text-xl font-bold text-cyan-300 mt-0.5">{avgLoad.toFixed(1)} kW</div>
                <div className="text-[10px] text-graphite-400 mt-0.5">Expected baseline load rate</div>
              </div>

              <div className="p-2.5 rounded-lg bg-graphite-950 border border-graphite-800">
                <div className="text-graphite-400 text-[10px] uppercase">Total Projected Energy</div>
                <div className="text-xl font-bold text-teal-300 mt-0.5">{(totalKWh / 1000).toFixed(2)} MWh</div>
                <div className="text-[10px] text-graphite-400 mt-0.5">Integrated volume over period</div>
              </div>

              {metrics && (
                <div className="pt-2 border-t border-graphite-800 space-y-1 text-[11px]">
                  <div className="text-graphite-300 font-semibold mb-1">Model Accuracy Profile:</div>
                  <div className="flex justify-between text-graphite-400">
                    <span>MAE:</span>
                    <span className="text-teal-400 font-bold">{metrics.mae.toFixed(2)} kW</span>
                  </div>
                  <div className="flex justify-between text-graphite-400">
                    <span>RMSE:</span>
                    <span className="text-teal-400 font-bold">{metrics.rmse.toFixed(2)} kW</span>
                  </div>
                  <div className="flex justify-between text-graphite-400">
                    <span>MAPE:</span>
                    <span className="text-teal-400 font-bold">{metrics.mape.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between text-graphite-400">
                    <span>R² Score:</span>
                    <span className="text-emerald-400 font-bold">{metrics.r2.toFixed(3)}</span>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

      </div>

      {/* Bottom Table: Tabular Forecast Breakdown */}
      <GlassCard glow="none" className="p-4">
        <div className="flex items-center justify-between border-b border-graphite-800 pb-2 mb-3">
          <h3 className="font-mono text-xs font-semibold text-graphite-200 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-400" />
            Timestep Forecast Inspection Table
          </h3>
          <span className="font-mono text-[10px] text-graphite-400">
            Showing {forecastData.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-graphite-800 text-graphite-400 text-[10px] uppercase">
                <th className="py-2 px-3">Timestep ISO</th>
                <th className="py-2 px-3">Actual kW</th>
                <th className="py-2 px-3">Forecast kW</th>
                <th className="py-2 px-3">Lower 95% CI</th>
                <th className="py-2 px-3">Upper 95% CI</th>
                <th className="py-2 px-3 text-right">Residual Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-graphite-800/60">
              {forecastData.slice(0, 15).map((row, i) => {
                const delta = row.actual !== undefined && row.predicted !== undefined ? row.actual - row.predicted : null;
                return (
                  <tr key={i} className="hover:bg-graphite-900/60 transition-colors">
                    <td className="py-2 px-3 text-graphite-300">{new Date(row.timestamp).toLocaleString()}</td>
                    <td className="py-2 px-3 text-emerald-400 font-semibold">{row.actual !== undefined ? row.actual.toFixed(2) : '—'}</td>
                    <td className="py-2 px-3 text-cyan-400 font-semibold">{row.predicted !== undefined ? row.predicted.toFixed(2) : '—'}</td>
                    <td className="py-2 px-3 text-graphite-400">{row.lower_ci !== undefined ? row.lower_ci.toFixed(2) : '—'}</td>
                    <td className="py-2 px-3 text-graphite-400">{row.upper_ci !== undefined ? row.upper_ci.toFixed(2) : '—'}</td>
                    <td className={`py-2 px-3 text-right font-bold ${delta !== null && Math.abs(delta) > 20 ? 'text-amber-400' : 'text-graphite-400'}`}>
                      {delta !== null ? (delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

    </div>
  );
}
