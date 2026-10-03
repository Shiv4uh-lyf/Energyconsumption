'use client';

import React, { useState } from 'react';
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
      
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#121212] tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-zinc-900" />
            SYSTEM CONFIGURATION & SETTINGS
          </h1>
          <p className="text-xs font-semibold text-zinc-600 mt-1">
            Configure FastAPI backend connection, default inference engines, and dataset upload
          </p>
        </div>

        <button
          onClick={handleSave}
          className="i-btn-black px-5 py-2.5 flex items-center space-x-2 shadow-sm text-xs font-extrabold"
        >
          <Save className="w-4 h-4 text-emerald-400" />
          <span>{saved ? 'Saved ✓' : 'Save Settings'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Backend API Configuration */}
        <div className="i-card-white p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b border-zinc-200 pb-3">
            <Server className="w-5 h-5 text-[#121212]" />
            <h2 className="text-sm font-extrabold text-[#121212] uppercase tracking-wider">
              Backend Endpoint Routing
            </h2>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1.5">
              FastAPI REST API Host Endpoint
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full bg-white text-xs font-mono font-bold text-[#121212] rounded-xl p-3 border-2 border-zinc-300 focus:outline-none focus:border-zinc-900 shadow-sm"
            />
          </div>

          <div className="pt-2">
            <label className="block text-xs font-bold text-zinc-800 mb-1.5">
              Default Forecasting Engine
            </label>
            <select
              value={defaultModel}
              onChange={(e) => setDefaultModel(e.target.value)}
              className="w-full bg-white text-xs font-bold text-[#121212] rounded-xl p-3 border-2 border-zinc-300 focus:outline-none focus:border-zinc-900 shadow-sm"
            >
              <option value="Ensemble">Weighted Ensemble (XGB+RF+LR)</option>
              <option value="xgboost">XGBoost Regressor</option>
              <option value="random_forest">Random Forest Regressor</option>
              <option value="linear_regression">Ridge Linear Regression</option>
              <option value="sarima">SARIMA Seasonal Model</option>
            </select>
          </div>
        </div>

        {/* Retraining & Data Upload */}
        <div className="i-card-white p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b border-zinc-200 pb-3">
            <Zap className="w-5 h-5 text-[#121212]" />
            <h2 className="text-sm font-extrabold text-[#121212] uppercase tracking-wider">
              ML Pipeline Retraining & Custom Telemetry
            </h2>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleRetrain}
              disabled={retraining}
              className="w-full i-btn-black py-3 px-4 flex items-center justify-center space-x-2 shadow-sm font-extrabold text-xs"
            >
              <RefreshCw className={`w-4 h-4 text-cyan-400 ${retraining ? 'animate-spin' : ''}`} />
              <span>{retraining ? 'Retraining All ML Models...' : 'Trigger Asynchronous Retraining'}</span>
            </button>

            {retrainMsg && (
              <p className="text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-center">
                {retrainMsg}
              </p>
            )}

            <button
              onClick={() => setShowUploadModal(true)}
              className="w-full i-btn-outline py-3 px-4 flex items-center justify-center space-x-2 shadow-sm font-extrabold text-xs"
            >
              <Upload className="w-4 h-4 text-[#121212]" />
              <span>Upload Custom Telemetry CSV</span>
            </button>
          </div>
        </div>

      </div>

      <CsvUploaderModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />

    </div>
  );
}
