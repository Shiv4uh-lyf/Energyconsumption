'use client';

import React, { useState } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, FileText, Database, ArrowRight, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

interface CsvUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CsvUploaderModal({ isOpen, onClose, onSuccess }: CsvUploaderModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [timestampCol, setTimestampCol] = useState<string>('');
  const [valueCol, setValueCol] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [applying, setApplying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a valid .csv file.');
      return;
    }
    setFile(selectedFile);
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await api.uploadData(selectedFile);
      setPreviewData(res);
      // Auto select candidates if detected
      if (res.timestamp_candidates && res.timestamp_candidates.length > 0) {
        setTimestampCol(res.timestamp_candidates[0]);
      } else if (res.columns && res.columns.length > 0) {
        setTimestampCol(res.columns[0]);
      }

      if (res.value_candidates && res.value_candidates.length > 0) {
        setValueCol(res.value_candidates[0]);
      } else if (res.columns && res.columns.length > 1) {
        setValueCol(res.columns[1]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to parse CSV file.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!file || !timestampCol || !valueCol) {
      setError('Please select both timestamp and energy consumption columns.');
      return;
    }
    setApplying(true);
    setError(null);

    try {
      const res = await api.applyUpload(file, timestampCol, valueCol);
      setSuccessMsg(`Successfully loaded ${res.rows.toLocaleString()} timesteps as active dataset!`);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
        setFile(null);
        setPreviewData(null);
      }, 2000);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to apply dataset mapping.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-graphite-950 border border-graphite-800 rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-graphite-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-mono text-base font-bold text-white">CUSTOM CSV TELEMETRY UPLOADER</h2>
              <p className="text-[11px] font-mono text-graphite-400">Ingest real smart meter or grid sensor consumption datasets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-graphite-400 hover:text-white hover:bg-graphite-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 font-mono text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 font-mono text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Step 1: Drop Zone */}
        {!file && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileChange(e.dataTransfer.files[0]);
              }
            }}
            className="border-2 border-dashed border-graphite-700 hover:border-teal-500 rounded-xl p-8 text-center transition-colors cursor-pointer bg-graphite-900/40 space-y-3"
          >
            <input
              type="file"
              accept=".csv"
              id="csvFileInput"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />
            <label htmlFor="csvFileInput" className="cursor-pointer space-y-3 block">
              <Upload className="w-10 h-10 text-teal-400 mx-auto animate-bounce" />
              <div>
                <p className="font-mono text-sm font-semibold text-white">Drag & drop your energy CSV file here</p>
                <p className="font-mono text-xs text-graphite-400 mt-1">or click to browse local files (.csv format)</p>
              </div>
            </label>
          </div>
        )}

        {/* Step 2: Mapping & Preview */}
        {file && previewData && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-graphite-900 border border-graphite-800 flex items-center justify-between font-mono text-xs">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-teal-400" />
                <span className="text-white font-semibold">{file.name}</span>
                <span className="text-graphite-400">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
              <button
                onClick={() => { setFile(null); setPreviewData(null); }}
                className="text-graphite-400 hover:text-rose-400 text-[11px]"
              >
                Change File
              </button>
            </div>

            {/* Column Selector Grid */}
            <div className="grid grid-cols-2 gap-4 font-mono text-xs">
              <div>
                <label className="block text-graphite-400 text-[11px] mb-1 font-semibold">
                  Timestamp Column ISO
                </label>
                <select
                  value={timestampCol}
                  onChange={(e) => setTimestampCol(e.target.value)}
                  className="w-full bg-graphite-900 border border-graphite-700 text-teal-300 rounded-lg p-2 focus:border-teal-500 outline-none"
                >
                  {previewData.columns.map((col: string) => (
                    <option key={col} value={col}>
                      {col} {previewData.timestamp_candidates?.includes(col) ? ' (Detected)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-graphite-400 text-[11px] mb-1 font-semibold">
                  Consumption Value Column (kW/kWh)
                </label>
                <select
                  value={valueCol}
                  onChange={(e) => setValueCol(e.target.value)}
                  className="w-full bg-graphite-900 border border-graphite-700 text-cyan-300 rounded-lg p-2 focus:border-cyan-500 outline-none"
                >
                  {previewData.columns.map((col: string) => (
                    <option key={col} value={col}>
                      {col} {previewData.value_candidates?.includes(col) ? ' (Detected)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table Preview */}
            <div className="space-y-1.5">
              <span className="font-mono text-[11px] text-graphite-400 font-semibold">
                Dataset Preview ({previewData.rows} total rows)
              </span>
              <div className="overflow-x-auto border border-graphite-800 rounded-lg max-h-40">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-graphite-900 text-graphite-400 text-[10px] uppercase border-b border-graphite-800">
                    <tr>
                      {previewData.columns.slice(0, 5).map((col: string) => (
                        <th key={col} className={`py-1.5 px-3 ${col === timestampCol ? 'text-teal-400' : col === valueCol ? 'text-cyan-400' : ''}`}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-graphite-800/60 bg-graphite-950/60">
                    {previewData.preview.map((row: any, i: number) => (
                      <tr key={i}>
                        {previewData.columns.slice(0, 5).map((col: string) => (
                          <td key={col} className={`py-1.5 px-3 text-graphite-300 ${col === timestampCol ? 'text-teal-300 font-bold' : col === valueCol ? 'text-cyan-300 font-bold' : ''}`}>
                            {String(row[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Apply Button */}
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-graphite-900 hover:bg-graphite-800 text-graphite-300 font-mono text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={applying}
                className="px-5 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-graphite-950 font-mono text-xs font-bold transition-all flex items-center space-x-1.5 shadow-lg"
              >
                {applying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Dataset...</span>
                  </>
                ) : (
                  <>
                    <span>Apply & Ingest Dataset</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
