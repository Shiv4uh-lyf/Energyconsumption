'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Zap, 
  TrendingUp, 
  BarChart3, 
  Activity, 
  AlertTriangle, 
  BrainCircuit, 
  Database, 
  Settings, 
  Bot,
  Search,
  Bell,
  Plus,
  User,
  Shield,
  Server,
  X,
  CheckCircle2
} from 'lucide-react';
import { api } from '@/lib/api';

interface NavbarProps {
  onOpenCoPilot?: () => void;
  onOpenCreateModal?: () => void;
}

const mainNavItems = [
  { name: 'Dashboard', path: '/', icon: Zap },
  { name: 'Forecast Studio', path: '/forecast', icon: TrendingUp },
  { name: 'Model Arena', path: '/models', icon: BarChart3 },
  { name: 'Pattern Explorer', path: '/patterns', icon: Activity },
  { name: 'Anomaly Monitor', path: '/anomalies', icon: AlertTriangle },
  { name: 'AI Analyst', path: '/analyst', icon: BrainCircuit },
  { name: 'Data Health', path: '/health', icon: Database },
];

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:flex flex-col justify-between i-sidebar-card p-5 h-[calc(100vh-3rem)] sticky top-6 z-30">
      
      {/* Top Logo & Main Navigation */}
      <div className="space-y-6">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-3 px-2 py-1 group cursor-pointer">
          <div className="w-10 h-10 rounded-2xl bg-[#121212] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 text-teal-400 fill-teal-400" />
          </div>
          <div>
            <div className="font-extrabold text-lg text-[#121212] tracking-tight flex items-center space-x-1">
              <span>EnerSight</span>
              <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />
            </div>
            <p className="text-xs font-bold text-zinc-500">AI Command Studio</p>
          </div>
        </Link>

        {/* Main Workstation Links */}
        <nav className="space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`w-full flex items-center space-x-3 px-4 py-3 font-bold text-xs tracking-wide transition-all ${
                  isActive 
                    ? 'bg-[#121212] text-white rounded-xl shadow-md' 
                    : 'text-zinc-700 hover:text-[#121212] hover:bg-zinc-100 rounded-xl'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-700'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Section: Integrations */}
        <div className="pt-3 border-t border-zinc-200">
          <p className="px-4 text-[11px] font-extrabold tracking-wider text-zinc-800 uppercase mb-2">
            INTEGRATIONS
          </p>
          <div className="space-y-1.5 text-xs font-bold text-zinc-700">
            <button
              onClick={() => router.push('/health')}
              className="w-full flex items-center space-x-2.5 px-4 py-1.5 rounded-lg hover:bg-zinc-100 cursor-pointer text-left"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>FastAPI Engine</span>
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full flex items-center space-x-2.5 px-4 py-1.5 rounded-lg hover:bg-zinc-100 cursor-pointer text-left"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              <span>Next.js App Router</span>
            </button>
            <button 
              onClick={() => router.push('/settings')}
              className="flex items-center space-x-2 px-4 py-1.5 text-zinc-600 hover:text-zinc-900 text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>Add ML pipeline</span>
            </button>
          </div>
        </div>

        {/* Section: ML Engines */}
        <div className="pt-3 border-t border-zinc-200">
          <p className="px-4 text-[11px] font-extrabold tracking-wider text-zinc-800 uppercase mb-2">
            ML ENGINES
          </p>
          <div className="space-y-1 text-xs font-bold text-zinc-700">
            <button 
              onClick={() => router.push('/models')}
              className="w-full flex items-center space-x-2 px-4 py-1 hover:bg-zinc-100 rounded text-left"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-900" />
              <span>XGBoost & Ensemble</span>
            </button>
            <button 
              onClick={() => router.push('/models')}
              className="w-full flex items-center space-x-2 px-4 py-1 hover:bg-zinc-100 rounded text-left"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
              <span>SARIMA & Ridge</span>
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Settings Link */}
      <div className="pt-3 border-t border-zinc-200">
        <Link
          href="/settings"
          className={`w-full flex items-center space-x-3 px-4 py-3 font-bold text-xs tracking-wide transition-all ${
            pathname === '/settings' 
              ? 'bg-[#121212] text-white rounded-xl shadow-md' 
              : 'text-zinc-700 hover:text-[#121212] hover:bg-zinc-100 rounded-xl'
          }`}
        >
          <Settings className="w-4 h-4 text-zinc-700" />
          <span>Settings</span>
        </Link>
      </div>

    </aside>
  );
}

export function TopHeaderBar({ onOpenCoPilot, onOpenCreateModal }: NavbarProps) {
  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await api.getHealth();
        setIsBackendConnected(health.status === 'ok' || health.status === 'degraded');
      } catch (err) {
        setIsBackendConnected(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pt-1 relative z-40">
      
      {/* Left Greeting */}
      <div>
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#121212] tracking-tight">
            Hi, Dispatcher!
          </h1>
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-white text-zinc-900 border border-zinc-300 shadow-sm flex items-center space-x-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${isBackendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span>{isBackendConnected ? 'LIVE ML BACKEND' : 'DISCONNECTED'}</span>
          </span>
        </div>
        <p className="text-xs font-bold text-zinc-600 mt-0.5">
          Welcome back to EnerSight AI Command Center
        </p>
      </div>

      {/* Right Top Actions */}
      <div className="flex items-center space-x-2.5 sm:space-x-3 relative">
        
        {/* AI Co-Pilot Button */}
        {onOpenCoPilot && (
          <button
            onClick={onOpenCoPilot}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-full bg-white text-[#121212] hover:bg-zinc-100 border border-zinc-300 text-xs font-bold transition-all shadow-sm"
          >
            <Bot className="w-4 h-4 text-teal-600" />
            <span>AI Co-Pilot</span>
          </button>
        )}

        {/* + Create Button */}
        <button
          onClick={onOpenCreateModal}
          className="i-btn-black px-5 py-2.5 flex items-center space-x-2 shadow-sm font-bold text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Create</span>
        </button>

        {/* Search Icon Button */}
        <button 
          onClick={onOpenCoPilot}
          className="w-10 h-10 rounded-full bg-white text-zinc-900 hover:bg-zinc-100 border border-zinc-300 shadow-sm flex items-center justify-center transition-all"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Notification Bell Button */}
        <div className="relative">
          <button 
            onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false); }}
            className="relative w-10 h-10 rounded-full bg-white text-zinc-900 hover:bg-zinc-100 border border-zinc-300 shadow-sm flex items-center justify-center transition-all"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
          </button>

          {/* Notifications Dropdown Panel */}
          {notificationsOpen && (
            <div className="absolute right-0 top-12 w-80 bg-[#121212] text-white rounded-3xl border border-zinc-700 shadow-2xl p-4 z-50 space-y-3 font-sans text-xs">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-extrabold text-sm text-white">Grid Notifications</span>
                <button onClick={() => setNotificationsOpen(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="p-3 bg-[#18181b] rounded-2xl border border-zinc-800 space-y-1">
                  <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ML Pipeline Retrained</span>
                  </div>
                  <p className="text-[11px] font-semibold text-zinc-300">Weighted Ensemble updated with MAE 0.034 kWh score.</p>
                  <span className="text-[9px] font-bold text-zinc-500">2 minutes ago</span>
                </div>

                <div className="p-3 bg-[#18181b] rounded-2xl border border-zinc-800 space-y-1">
                  <div className="flex items-center space-x-1.5 text-amber-400 font-bold text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Substation B Surge Alert</span>
                  </div>
                  <p className="text-[11px] font-semibold text-zinc-300">+14.3 kWh load deviation detected by Isolation Forest.</p>
                  <span className="text-[9px] font-bold text-zinc-500">15 minutes ago</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar & Menu */}
        <div className="relative">
          <button 
            onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); }}
            className="w-10 h-10 rounded-full bg-[#121212] text-white font-extrabold text-xs flex items-center justify-center shadow-md border-2 border-zinc-300 hover:border-zinc-900 transition-all"
          >
            EA
          </button>

          {/* Profile Dropdown */}
          {profileOpen && (
            <div className="absolute right-0 top-12 w-64 bg-[#121212] text-white rounded-3xl border border-zinc-700 shadow-2xl p-4 z-50 space-y-3 font-sans text-xs">
              <div className="flex items-center space-x-3 border-b border-zinc-800 pb-3">
                <div className="w-9 h-9 rounded-full bg-teal-500 text-[#121212] font-extrabold flex items-center justify-center text-xs">
                  EA
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Dispatcher Operator</h3>
                  <p className="text-[11px] font-bold text-zinc-400">Chief Grid Controller</p>
                </div>
              </div>

              <div className="space-y-1 font-bold text-zinc-300 text-[11px]">
                <div className="flex items-center justify-between p-2 hover:bg-zinc-800 rounded-xl">
                  <span>FastAPI Endpoint:</span>
                  <span className="text-teal-400 font-mono">localhost:8000</span>
                </div>
                <div className="flex items-center justify-between p-2 hover:bg-zinc-800 rounded-xl">
                  <span>Next.js Frontend:</span>
                  <span className="text-cyan-400 font-mono">localhost:3000</span>
                </div>
              </div>

              <button 
                onClick={() => setProfileOpen(false)}
                className="w-full py-2 bg-zinc-800 text-white font-extrabold rounded-xl hover:bg-zinc-700 text-center"
              >
                Close Profile
              </button>
            </div>
          )}
        </div>

      </div>

    </header>
  );
}

export function Navbar({ onOpenCoPilot }: NavbarProps) {
  return null;
}
