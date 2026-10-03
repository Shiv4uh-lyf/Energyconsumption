'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HeroEnergyWave } from '@/components/3d/HeroEnergyWave';
import { ForecastChart } from '@/components/charts/ForecastChart';
import { DemandResponseSimulator } from '@/components/DemandResponseSimulator';
import { ExecutiveReportModal } from '@/components/ExecutiveReportModal';
import { 
  Zap, 
  Share2, 
  MoreVertical, 
  Target, 
  Loader2, 
  CheckCircle2, 
  TrendingUp, 
  Download, 
  Pin, 
  Edit3, 
  Trash2, 
  Bell, 
  Plus, 
  ChevronRight, 
  SlidersHorizontal, 
  Grid, 
  List, 
  CheckSquare, 
  Activity,
  Check
} from 'lucide-react';
import { api, Insight } from '@/lib/api';

export default function OverviewDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('Ensemble');
  const [horizon, setHorizon] = useState<number>(24);
  const [loading, setLoading] = useState<boolean>(true);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'wave' | 'chart' | 'simulator'>('wave');
  
  // Dynamic Interactivity States
  const [shareFeedback, setShareFeedback] = useState<boolean>(false);
  const [overallMenuOpen, setOverallMenuOpen] = useState<boolean>(false);

  // Interactive Checklist State
  const [goals, setGoals] = useState([
    { id: 1, text: 'Maintain Peak Load < 45 kWh', done: true },
    { id: 2, text: 'Execute XGBoost Model Retraining', done: false },
    { id: 3, text: 'Audit Telemetry Residual Anomalies', done: false },
    { id: 4, text: 'Calibrate SARIMA Baseline Engine', done: false },
    { id: 5, text: 'Run Demand Response Peak Shaving', done: true },
  ]);

  // Interactive Incident Tasks State
  const [tasks, setTasks] = useState([
    { id: '1', title: 'Substation B Load Spike Check', date: 'Today • High Severity', pinned: true, activeMenu: false },
    { id: '2', title: 'HVAC Peak Load Mitigation', date: '02.09.2026 • In Progress', pinned: false, activeMenu: false },
  ]);

  const toggleGoal = (id: number) => {
    setGoals(goals.map(g => g.id === id ? { ...g, done: !g.done } : g));
  };

  const handleAddGoal = () => {
    const text = prompt('Enter new optimization goal:');
    if (text && text.trim()) {
      setGoals([...goals, { id: Date.now(), text: text.trim(), done: false }]);
    }
  };

  const handleAddTask = () => {
    const title = prompt('Enter new task title:');
    if (title && title.trim()) {
      setTasks([
        ...tasks,
        { id: Date.now().toString(), title: title.trim(), date: 'Just now • Active', pinned: false, activeMenu: false }
      ]);
    }
  };

  const handleToggleTaskMenu = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, activeMenu: !t.activeMenu } : { ...t, activeMenu: false }));
  };

  const handlePinTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, pinned: !t.pinned, activeMenu: false } : t));
  };

  const handleEditTask = (id: string) => {
    const existing = tasks.find(t => t.id === id);
    const updated = prompt('Edit task title:', existing?.title);
    if (updated && updated.trim()) {
      setTasks(tasks.map(t => t.id === id ? { ...t, title: updated.trim(), activeMenu: false } : t));
    }
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    setShareFeedback(true);
    setTimeout(() => setShareFeedback(false), 2500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const fcRes = await api.getForecast({ model_name: selectedModel, horizon_hours: horizon });
      setData(fcRes.forecast);

      const sumRes = await api.getSummary();
      setSummary(sumRes);

      const anomRes = await api.getAnomalies(100);
      setAnomalies(anomRes.anomalies);
    } catch (err) {
      console.error('Failed to load overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedModel, horizon]);

  const currentLoad = summary?.statistics?.mean ? (summary.statistics.mean * 12.4).toFixed(1) : '43.8';
  const anomalyCount = anomalies.length > 0 ? anomalies.length : 11;

  return (
    <div className="space-y-6">
      
      {/* ─── ROW 1: Overall Information | Weekly Progress | Month Progress ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CARD 1: Overall Information (Dark Card) */}
        <div className="lg:col-span-5 i-card-dark p-6 flex flex-col justify-between relative overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-white">
              Overall Information
            </h2>
            <div className="flex items-center space-x-2 text-zinc-400 relative">
              <button 
                onClick={handleShare}
                title="Share link"
                className="hover:text-white p-1 transition-colors relative"
              >
                <Share2 className="w-4 h-4" />
                {shareFeedback && (
                  <span className="absolute -top-7 -left-12 px-2 py-0.5 rounded bg-emerald-500 text-black text-[9px] font-bold shadow-md whitespace-nowrap">
                    Link Copied!
                  </span>
                )}
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setOverallMenuOpen(!overallMenuOpen)}
                  className="hover:text-white p-1 transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {overallMenuOpen && (
                  <div className="absolute right-0 top-7 w-40 bg-[#1c1c24] text-white rounded-2xl shadow-2xl p-2 z-30 space-y-1 text-xs font-bold border border-zinc-700">
                    <button onClick={() => { loadData(); setOverallMenuOpen(false); }} className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 rounded-xl">
                      Refresh Telemetry
                    </button>
                    <button onClick={() => { setShowReportModal(true); setOverallMenuOpen(false); }} className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 rounded-xl">
                      Download Summary
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Stat Display */}
          <div className="my-6">
            <div className="flex items-baseline space-x-3">
              <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
                {currentLoad} <span className="text-2xl font-semibold text-zinc-400">kWh</span>
              </span>
              <span className="text-xs font-semibold text-zinc-400">
                Current load demand
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-medium mt-1">
              <span className="text-white font-bold">2 ML Engines</span> active in production pipeline
            </p>
          </div>

          {/* 3 Light Sub-Cards at Bottom */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            
            <div onClick={() => router.push('/forecast')} className="i-subcard-light p-3.5 text-center flex flex-col items-center justify-center cursor-pointer hover:bg-white transition-all">
              <div className="w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center mb-1.5">
                <Target className="w-3.5 h-3.5" />
              </div>
              <span className="text-xl font-extrabold text-[#121212] leading-none">28</span>
              <span className="text-[10px] font-bold text-zinc-500 mt-1">Peak Loads</span>
            </div>

            <div onClick={() => router.push('/models')} className="i-subcard-light p-3.5 text-center flex flex-col items-center justify-center cursor-pointer hover:bg-white transition-all">
              <div className="w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center mb-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              </div>
              <span className="text-xl font-extrabold text-[#121212] leading-none">14</span>
              <span className="text-[10px] font-bold text-zinc-500 mt-1">In Progress</span>
            </div>

            <div onClick={() => router.push('/anomalies')} className="i-subcard-light p-3.5 text-center flex flex-col items-center justify-center cursor-pointer hover:bg-white transition-all">
              <div className="w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center mb-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-xl font-extrabold text-[#121212] leading-none">{anomalyCount}</span>
              <span className="text-[10px] font-bold text-zinc-500 mt-1">Completed</span>
            </div>

          </div>
        </div>

        {/* CARD 2: Weekly Progress (Light Card with Wavy Telemetry Curve) */}
        <div className="lg:col-span-4 i-card-white p-6 flex flex-col justify-between">
          
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#121212]">Weekly progress</h2>
              <div className="flex items-center space-x-3 text-[11px] font-semibold text-zinc-500 mt-0.5">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-[#121212]" />
                  <span>Telemetry</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-zinc-400" />
                  <span>Forecast</span>
                </span>
              </div>
            </div>
            <button onClick={() => router.push('/forecast')} className="px-2.5 py-1 rounded-full bg-[#121212] text-white text-xs font-bold shadow-sm hover:scale-105 transition-transform">
              +24%
            </button>
          </div>

          {/* SVG Smooth Wavy Telemetry Curve Chart */}
          <div className="my-4 relative h-32 w-full flex items-center justify-center">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#121212" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#121212" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 70 Q 40 20, 80 50 T 160 30 T 240 60 T 300 20 L 300 100 L 0 100 Z"
                fill="url(#waveGrad)"
              />
              <path
                d="M 0 80 Q 40 40, 80 65 T 160 45 T 240 70 T 300 35"
                fill="none"
                stroke="#a1a1aa"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <path
                d="M 0 70 Q 40 20, 80 50 T 160 30 T 240 60 T 300 20"
                fill="none"
                stroke="#121212"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="240" cy="60" r="4" fill="#121212" />
            </svg>
          </div>

          {/* Days of Week Row */}
          <div className="flex items-center justify-between text-xs font-bold text-zinc-400 px-1">
            <span>M</span>
            <span>T</span>
            <span>W</span>
            <span>T</span>
            <span>F</span>
            <span className="w-6 h-6 rounded-full bg-[#121212] text-white flex items-center justify-center">S</span>
            <span>S</span>
          </div>

        </div>

        {/* CARD 3: Month Progress / Grid Efficiency */}
        <div className="lg:col-span-3 i-card-white p-6 flex flex-col justify-between">
          
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#121212]">Month progress</h2>
              <TrendingUp className="w-4 h-4 text-zinc-700" />
            </div>
            <p className="text-xs font-bold text-zinc-500 mt-0.5">
              +20% compared to last month*
            </p>
          </div>

          {/* Circular Donut Progress Ring */}
          <div className="my-4 flex items-center justify-around">
            <div className="text-xs font-semibold space-y-1 text-zinc-600">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#121212]" />
                <span>Base Load</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
                <span>Peak Shift</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
                <span>Target</span>
              </div>
            </div>

            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="38" stroke="#e4e4e7" strokeWidth="8" fill="transparent" />
                <circle cx="48" cy="48" r="38" stroke="#121212" strokeWidth="8" fill="transparent" strokeDasharray="238" strokeDashoffset="48" strokeLinecap="round" />
              </svg>
              <span className="absolute font-extrabold text-base text-[#121212]">120%</span>
            </div>
          </div>

          {/* Download Report Button */}
          <button
            onClick={() => setShowReportModal(true)}
            className="w-full i-btn-outline py-2.5 px-4 flex items-center justify-center space-x-2 shadow-sm"
          >
            <span>Download Report</span>
            <Download className="w-3.5 h-3.5" />
          </button>

        </div>

      </div>


      {/* ─── ROW 2: Month Goals | Active Incident Cards ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CARD 1: Grid Goals / Optimization Checklist */}
        <div className="lg:col-span-5 i-card-white p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-[#121212]">Month goals:</h2>
                <span className="w-6 h-6 rounded-full bg-zinc-100 border border-zinc-200 text-[11px] font-bold text-zinc-700 flex items-center justify-center">
                  {goals.filter(g => g.done).length}
                </span>
              </div>
              <button 
                onClick={handleAddGoal}
                title="Add new goal"
                className="text-zinc-400 hover:text-zinc-900 p-1 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            {/* Checklist Items */}
            <div className="space-y-3">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  onClick={() => toggleGoal(goal.id)}
                  className="flex items-center space-x-3 cursor-pointer group"
                >
                  {goal.done ? (
                    <div className="w-5 h-5 rounded-md bg-[#121212] text-white flex items-center justify-center shadow-sm">
                      <CheckSquare className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-md border-2 border-zinc-300 group-hover:border-zinc-500" />
                  )}
                  <span className={`text-xs font-semibold ${goal.done ? 'line-through text-zinc-400' : 'text-zinc-800'}`}>
                    {goal.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CARD 2: Active Incident Stream / Tasks in Process */}
        <div className="lg:col-span-7 i-card-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#121212]">
              Task In process ({tasks.length})
            </h2>
            <button 
              onClick={() => router.push('/anomalies')}
              className="text-xs font-bold text-zinc-500 hover:text-zinc-900 flex items-center space-x-1"
            >
              <span>Open archive</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {tasks.map((task) => (
              <div key={task.id} className="i-subcard-light p-4 flex flex-col justify-between relative border border-zinc-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center">
                    <Zap className="w-4 h-4 text-[#121212]" />
                  </div>
                  <div className="relative">
                    <button 
                      onClick={() => handleToggleTaskMenu(task.id)}
                      className="p-1 text-zinc-400 hover:text-zinc-800"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Task Context Menu */}
                    {task.activeMenu && (
                      <div className="absolute right-0 top-6 w-32 bg-[#121212] text-white rounded-2xl shadow-xl p-2 z-30 space-y-1 text-[11px] font-bold border border-zinc-700">
                        <button onClick={() => handlePinTask(task.id)} className="w-full text-left px-2 py-1.5 hover:bg-zinc-800 rounded flex items-center space-x-2">
                          <Pin className="w-3 h-3 text-teal-400" />
                          <span>{task.pinned ? 'Unpin' : 'Pin Note'}</span>
                        </button>
                        <button onClick={() => handleEditTask(task.id)} className="w-full text-left px-2 py-1.5 hover:bg-zinc-800 rounded flex items-center space-x-2">
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button onClick={() => handleDeleteTask(task.id)} className="w-full text-left px-2 py-1.5 hover:bg-zinc-800 rounded text-rose-400 flex items-center space-x-2">
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="my-4">
                  <h3 className="text-xs font-extrabold text-[#121212] leading-snug">
                    {task.title} {task.pinned && <span className="text-teal-600">📌</span>}
                  </h3>
                  <span className="text-[10px] font-semibold text-zinc-400 mt-1 block">
                    {task.date}
                  </span>
                </div>

                <div className="flex justify-end">
                  <div className="w-7 h-7 rounded-xl bg-[#121212] text-white flex items-center justify-center shadow-sm">
                    <Bell className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              </div>
            ))}

            {/* Add Task Dotted Button */}
            <button 
              onClick={handleAddTask}
              className="i-subcard-light border-2 border-dashed border-zinc-300 p-4 flex flex-col items-center justify-center text-zinc-500 hover:border-zinc-800 hover:text-zinc-900 transition-all min-h-[140px]"
            >
              <Plus className="w-6 h-6 mb-1" />
              <span className="text-xs font-bold">+ Add task</span>
            </button>

          </div>
        </div>

      </div>


      {/* ─── INTERACTIVE TELEMETRY & FORECAST WORKSTATION TABS ─── */}
      <div className="i-card-white p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-zinc-200/80 pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-[#121212] tracking-tight">
              Interactive Telemetry & Model Pipeline Studio
            </h2>
            <p className="text-xs font-semibold text-zinc-400">
              3D Surface Wave telemetry, multi-horizon forecast curves, and demand response simulator
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-zinc-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('wave')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'wave' ? 'bg-[#121212] text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              3D Telemetry Wave
            </button>
            <button
              onClick={() => setActiveTab('chart')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'chart' ? 'bg-[#121212] text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Forecast Curve
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'simulator' ? 'bg-[#121212] text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Peak Shaving Simulator
            </button>
          </div>
        </div>

        {activeTab === 'wave' && (
          <div className="rounded-2xl overflow-hidden border border-zinc-200 bg-[#121212] p-2">
            <HeroEnergyWave data={data} />
          </div>
        )}

        {activeTab === 'chart' && (
          <div className="bg-white rounded-2xl p-4 border border-zinc-200">
            <ForecastChart data={data} horizon={horizon} selectedModel={selectedModel} />
          </div>
        )}

        {activeTab === 'simulator' && (
          <DemandResponseSimulator />
        )}
      </div>


      {/* ─── ROW 3: Active Engine Benchmarks (Dark Pill Cards) ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#121212]">
            Last Projects / Active ML Engines
          </h2>
          <div className="flex items-center space-x-2 text-xs font-bold text-zinc-500">
            <button onClick={() => router.push('/models')} className="flex items-center space-x-1 hover:text-zinc-900">
              <span>Sort by</span>
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-zinc-200">
              <Grid className="w-3.5 h-3.5 text-zinc-900" />
              <List className="w-3.5 h-3.5 text-zinc-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Dark Pill Card 1: Weighted Ensemble */}
          <div 
            onClick={() => router.push('/models')}
            className="i-card-dark p-5 flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-white">Weighted Ensemble Engine</h3>
                <span className="text-[11px] font-bold text-zinc-400 flex items-center space-x-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>In progress</span>
                </span>
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-white/20 flex items-center justify-center font-bold text-xs text-white">
                1/5
              </div>
            </div>

            <p className="text-xs text-zinc-400 mt-4 leading-relaxed line-clamp-2">
              Optimal inverse-MAE blend of XGBoost, Random Forest, and Linear Regression models.
            </p>
          </div>

          {/* Dark Pill Card 2: XGBoost Regressor */}
          <div 
            onClick={() => router.push('/models')}
            className="i-card-dark p-5 flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-white">XGBoost Regressor</h3>
                <span className="text-[11px] font-bold text-zinc-400 flex items-center space-x-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>Completed • MAE 0.038</span>
                </span>
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-cyan-400 text-cyan-400 flex items-center justify-center font-bold text-xs">
                5/5
              </div>
            </div>

            <p className="text-xs text-zinc-400 mt-4 leading-relaxed line-clamp-2">
              Gradient boosted decision trees optimized for temporal 24h & 168h lag features.
            </p>
          </div>

          {/* Dark Pill Card 3: SARIMA Engine */}
          <div 
            onClick={() => router.push('/models')}
            className="i-card-dark p-5 flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-white">SARIMA Time-Series</h3>
                <span className="text-[11px] font-bold text-zinc-400 flex items-center space-x-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>In progress</span>
                </span>
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-amber-400 text-amber-400 flex items-center justify-center font-bold text-xs">
                2/5
              </div>
            </div>

            <p className="text-xs text-zinc-400 mt-4 leading-relaxed line-clamp-2">
              Seasonal Autoregressive Integrated Moving Average for periodic 24h load profile.
            </p>
          </div>

        </div>
      </div>

      {/* Executive Audit Modal */}
      <ExecutiveReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />

    </div>
  );
}
