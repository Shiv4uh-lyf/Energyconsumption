'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { CsvUploaderModal } from '@/components/CsvUploaderModal';
import { 
  Settings, 
  Save, 
  Server, 
  Key, 
  RefreshCw, 
  CheckCircle,
  Database,
  Upload,
  Zap
} from 'lucide-react';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const [apiUrl, setApiUrl] = useState<string>('http://localhost:8000');
  const [defaultModel, setDefaultModel] = useState<string>('Ensemble');
  const [defaultHorizon, setDefaultHorizon] = useState<number>(24);
  const [llmKey, setLlmKey] = useState<string>('');
  const [saved, setSaved] = useState<boolean>(false);
  const [retraining, setRetraining] = useState<boolean>(false);
  const [retrainMsg, setRetrainMsg] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleRetrain = async () => {
    setRetraining(true);
    setRetrainMsg(null);
    try {
      const res = await api.retrainModels();
      setRetrainMsg(res.message);
    } catch (err: any) {
      setRetrainMsg('Retraining request failed. Check backend connection.');
    } finally {
      setTimeout(() => setRetraining(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-graphite-800/80 pb-4">
        <div>
          <h1 className="font-mono text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-teal-400" />
            SYSTEM CONFIGURATION & SETTINGS
          </h1>
          <p className="text-xs font-mono text-graphite-400 mt-1">
            Configure FastAPI backend connection, default inference engines, and dataset upload
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-teal-500 text-graphite-950 hover:bg-teal-400 font-mono text-xs font-bold transition-colors shadow-lg"
        >
          <Save className="w-4 h-4" />
          <span>Save Preferences</span>
        </button>
      </div>

      <CsvUploaderModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />

      {saved && (
        <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 font-mono text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>Settings saved successfully.</span>
        </div>
      )}

      {retrainMsg && (
        <div className="p-3 rounded-lg bg-teal-950/60 border border-teal-800 text-teal-300 font-mono text-xs flex items-center space-x-2">
          <Zap className="w-4 h-4 text-teal-400" />
          <span>{retrainMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Backend Connection */}
        <GlassCard glow="teal" className="p-4 space-y-4">
          <div className="flex items-center space-x-2 border-b border-graphite-800 pb-2">
            <Server className="w-4 h-4 text-teal-400" />
            <h3 className="font-mono text-xs font-semibold text-graphite-200 uppercase tracking-wider">
              Backend REST API Endpoint
            </h3>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-graphite-400 mb-1">
              FastAPI Server URL
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full bg-graphite-950 text-xs font-mono text-teal-300 rounded-lg p-2.5 border border-graphite-700 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-graphite-400 mb-1">
              Default Inference Engine
            </label>
            <select
              value={defaultModel}
              onChange={(e) => setDefaultModel(e.target.value)}
              className="w-full bg-graphite-950 text-xs font-mono text-cyan-300 rounded-lg p-2.5 border border-graphite-700 focus:outline-none focus:border-cyan-500"
            >
              <option value="Ensemble">Weighted Ensemble (Recommended)</option>
              <option value="xgboost">XGBoost Regressor</option>
              <option value="random_forest">Random Forest</option>
              <option value="linear_regression">Linear Regression</option>
              <option value="sarima">SARIMA Seasonal</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-graphite-400 mb-1">
              Default Forecast Horizon
            </label>
            <select
              value={defaultHorizon}
              onChange={(e) => setDefaultHorizon(Number(e.target.value))}
              className="w-full bg-graphite-950 text-xs font-mono text-amber-300 rounded-lg p-2.5 border border-graphite-700 focus:outline-none focus:border-amber-500"
            >
              <option value={24}>24 Hours (Daily)</option>
              <option value={48}>48 Hours (2-Day)</option>
              <option value={72}>72 Hours (3-Day)</option>
            </select>
          </div>
        </GlassCard>

        {/* Dataset Upload & Model Training */}
        <GlassCard glow="cyan" className="p-4 space-y-4">
          <div className="flex items-center space-x-2 border-b border-graphite-800 pb-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <h3 className="font-mono text-xs font-semibold text-graphite-200 uppercase tracking-wider">
              Dataset & Model Pipeline Management
            </h3>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-graphite-400 mb-1">
              Custom Energy Consumption Dataset
            </label>
            <button
              onClick={() => setShowUploadModal(true)}
              className="w-full py-2.5 rounded-lg bg-teal-500/20 border border-teal-500/40 hover:bg-teal-500/30 text-xs font-mono text-teal-300 font-bold flex items-center justify-center space-x-2 transition-colors shadow-md"
            >
              <Upload className="w-4 h-4 text-teal-400" />
              <span>Upload Custom CSV Telemetry File</span>
            </button>
            <p className="text-[10px] font-mono text-graphite-400 mt-1">
              Supports CSV files with timestamp and power/consumption values.
            </p>
          </div>

          <div className="pt-2 border-t border-graphite-800">
            <div className="text-xs font-mono text-graphite-300 font-semibold mb-2">
              Background Model Retraining Trigger
            </div>
            <button
              onClick={handleRetrain}
              disabled={retraining}
              className="w-full py-2.5 rounded-lg bg-graphite-900 border border-graphite-700 hover:bg-graphite-800 text-xs font-mono text-cyan-300 font-semibold flex items-center justify-center space-x-2 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${retraining ? 'animate-spin' : ''}`} />
              <span>{retraining ? 'Triggering Retrain...' : 'Retrain All ML Models Asynchronously'}</span>
            </button>
            <p className="text-[10px] font-mono text-graphite-400 mt-1">
              Runs model training script in backend and updates test metric benchmarks.
            </p>
          </div>
        </GlassCard>

      </div>

    </div>
  );
}
