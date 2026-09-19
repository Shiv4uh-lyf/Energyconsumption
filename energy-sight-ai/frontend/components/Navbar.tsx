'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Zap, 
  TrendingUp, 
  BarChart3, 
  Activity, 
  AlertTriangle, 
  BrainCircuit, 
  Database, 
  Settings, 
  ShieldCheck, 
  Radio,
  Bot
} from 'lucide-react';
import { api } from '@/lib/api';

interface NavbarProps {
  onOpenCoPilot?: () => void;
}

const navItems = [
  { name: 'Overview', path: '/', icon: Zap },
  { name: 'Forecast Studio', path: '/forecast', icon: TrendingUp },
  { name: 'Model Arena', path: '/models', icon: BarChart3 },
  { name: 'Pattern Explorer', path: '/patterns', icon: Activity },
  { name: 'Anomaly Monitor', path: '/anomalies', icon: AlertTriangle },
  { name: 'AI Analyst', path: '/analyst', icon: BrainCircuit },
  { name: 'Data Health', path: '/health', icon: Database },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export function Navbar({ onOpenCoPilot }: NavbarProps) {
  const pathname = usePathname();
  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);
  const [activeModel, setActiveModel] = useState<string>('Ensemble');

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
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-graphite-950/80 border-b border-graphite-800/60 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-teal-500 to-amber-500 opacity-75 blur transition duration-300 group-hover:opacity-100" />
              <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-graphite-900 border border-graphite-700 text-teal-400">
                <Zap className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold tracking-wider text-base text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-300 to-cyan-400">
                  ENERGYSIGHT
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  AI v1.0
                </span>
              </div>
              <p className="text-[10px] font-mono text-graphite-400 tracking-tight">
                ENERGY FORECASTING & INTELLIGENCE COMMAND
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-mono text-xs transition-all duration-200 ${
                    isActive
                      ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-[0_0_12px_rgba(20,184,166,0.15)] font-semibold'
                      : 'text-graphite-300 hover:text-graphite-100 hover:bg-graphite-800/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-400' : 'text-graphite-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* System Status Indicators & AI Co-Pilot Button */}
          <div className="flex items-center space-x-3">
            {onOpenCoPilot && (
              <button
                onClick={onOpenCoPilot}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-teal-500/20 via-cyan-500/20 to-emerald-500/20 text-teal-300 hover:border-teal-400/60 border border-teal-500/40 text-xs font-mono font-bold transition-all shadow-md group"
              >
                <Bot className="w-3.5 h-3.5 text-teal-400 group-hover:rotate-12 transition-transform" />
                <span>AI Co-Pilot</span>
              </button>
            )}

            {/* Model Badge */}
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-graphite-900 border border-graphite-800 text-[11px] font-mono text-graphite-300">
              <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span className="text-graphite-400">Engine:</span>
              <span className="text-cyan-300 font-medium">{activeModel}</span>
            </div>

            {/* Connection Status */}
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-graphite-900 border border-graphite-800 text-xs font-mono">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isBackendConnected === true ? 'bg-emerald-400' : isBackendConnected === false ? 'bg-rose-400' : 'bg-amber-400'
                }`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  isBackendConnected === true ? 'bg-emerald-500' : isBackendConnected === false ? 'bg-rose-500' : 'bg-amber-500'
                }`} />
              </span>
              <span className={
                isBackendConnected === true ? 'text-emerald-400' : isBackendConnected === false ? 'text-rose-400' : 'text-amber-400'
              }>
                {isBackendConnected === true ? 'LIVE BACKEND' : isBackendConnected === false ? 'DISCONNECTED' : 'CHECKING...'}
              </span>
            </div>
          </div>

        </div>

        {/* Mobile Navigation Row */}
        <div className="lg:hidden flex items-center space-x-1 overflow-x-auto py-2 border-t border-graphite-800/40 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded font-mono text-xs whitespace-nowrap ${
                  isActive
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    : 'text-graphite-300 hover:bg-graphite-800'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
