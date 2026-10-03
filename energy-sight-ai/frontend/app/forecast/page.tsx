'use client';

import React, { useState, useEffect } from 'react';
import { ForecastChart } from '@/components/charts/ForecastChart';
import { 
  TrendingUp, 
  Sliders, 
  CheckCircle2, 
  Clock, 
  Zap, 
  BarChart2, 
  Download,
  AlertCircle,
  Activity,
  Gauge,
  Layers
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

  const predictedVals = forecastData.map((f) => f.predicted ?? 0).filter((v) => v > 0);
  const maxPeak = predictedVals.length > 0 ? Math.max(...predictedVals) : 0;
  const avgLoad = predictedVals.length > 0 ? predictedVals.reduce((a, b) => a + b, 0) / predictedVals.length : 0;
  const totalKWh = predictedVals.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#121212] tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-zinc-900" />
            FORECAST STUDIO WORKSTATION
          </h1>
          <p className="text-xs font-semibold text-zinc-600 mt-1">
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
          className="i-btn-black px-4 py-2 flex items-center space-x-2 shadow-sm"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Export CSV Dataset</span>
        </button>
      </div>

      {/* Main 3-Column Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (3 cols): Control Panel */}
        <div className="lg:col-span-3 space-y-4">
          <div className="i-card-white p-5 space-y-5">
            
            <div className="flex items-center space-x-2 border-b border-zinc-200 pb-3">
              <Sliders className="w-4 h-4 text-[#121212]" />
              <h3 className="text-xs font-extrabold text-[#121212] uppercase tracking-wider">
                Inference Controls
              </h3>
            </div>

            {/* Model Selection Dropdown */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                Forecasting Model Engine
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-white text-xs font-bold text-[#121212] rounded-xl p-3 border-2 border-zinc-300 focus:outline-none focus:border-zinc-900 shadow-sm"
              >
                <option value="Ensemble">Weighted Ensemble (XGB+RF+LR)</option>
                <option value="xgboost">XGBoost Regressor</option>
                <option value="random_forest">Random Forest Regressor</option>
                <option value="linear_regression">Ridge Linear Regression</option>
                <option value="sarima">SARIMA Seasonal Model</option>
              </select>
            </div>

            {/* Horizon Selector */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                Forecast Horizon (Hours)
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[12, 24, 48, 72].map((h) => (
                  <button
                    key={h}
                    onClick={() => setHorizon(h)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      horizon === h
                        ? 'bg-[#121212] text-white shadow-md'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle CI Bands */}
            <div className="pt-3 border-t border-zinc-200 flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-800">
                Show 95% Confidence Band
              </span>
              <button
                onClick={() => setShowCI(!showCI)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  showCI ? 'bg-[#121212] justify-end' : 'bg-zinc-300 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>

            {/* Model Status Card */}
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center space-x-1.5 text-emerald-900 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Model Artifact Ready</span>
              </div>
              <p className="text-[11px] font-semibold text-emerald-800 leading-snug">
                Using trained joblib artifact with 24h lag & 7-day rolling statistics features.
              </p>
            </div>

          </div>
        </div>

        {/* Center Column (6 cols): Main Forecast Chart */}
        <div className="lg:col-span-6 space-y-4">
          <div className="i-card-white p-5">
            <ForecastChart
              data={forecastData}
              title={`${model.toUpperCase()} FORECAST CURVE (${horizon} HOURS AHEAD)`}
              height={380}
              showCI={showCI}
            />
          </div>
        </div>

        {/* Right Column (3 cols): Prediction Metrics Summary */}
        <div className="lg:col-span-3 space-y-4">
          
          <div className="flex items-center space-x-2 px-1">
            <BarChart2 className="w-4 h-4 text-[#121212]" />
            <h3 className="text-xs font-extrabold text-[#121212] uppercase tracking-wider">
              Prediction Metrics
            </h3>
          </div>

          {/* Metric 1: Peak Load */}
          <div className="i-card-dark p-5 flex flex-col justify-between">
            <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              PREDICTED PEAK LOAD
            </div>
            <div className="my-2">
              <span className="text-3xl font-extrabold text-white">
                {maxPeak.toFixed(1)} <span className="text-sm font-bold text-teal-400">kW</span>
              </span>
            </div>
            <p className="text-xs font-semibold text-zinc-300">
              Maximum demand in {horizon}h window
            </p>
          </div>

          {/* Metric 2: Average Load */}
          <div className="i-card-dark p-5 flex flex-col justify-between">
            <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              AVERAGE LOAD RATE
            </div>
            <div className="my-2">
              <span className="text-3xl font-extrabold text-cyan-300">
                {avgLoad.toFixed(1)} <span className="text-sm font-bold text-cyan-400">kW</span>
              </span>
            </div>
            <p className="text-xs font-semibold text-zinc-300">
              Expected baseline load rate
            </p>
          </div>

          {/* Metric 3: Total Projected Energy */}
          <div className="i-card-dark p-5 flex flex-col justify-between">
            <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              TOTAL PROJECTED ENERGY
            </div>
            <div className="my-2">
              <span className="text-3xl font-extrabold text-emerald-300">
                {(totalKWh / 1000).toFixed(2)} <span className="text-sm font-bold text-emerald-400">MWh</span>
              </span>
            </div>
            <p className="text-xs font-semibold text-zinc-300">
              Integrated volume over period
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
