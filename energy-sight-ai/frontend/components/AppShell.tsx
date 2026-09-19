'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { AIGridCoPilot } from '@/components/AIGridCoPilot';
import { Bot, Sparkles } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isCoPilotOpen, setIsCoPilotOpen] = useState<boolean>(false);

  return (
    <div className="relative z-10 flex flex-col min-h-screen">
      <Navbar onOpenCoPilot={() => setIsCoPilotOpen(true)} />
      
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Floating Co-Pilot Summon Button (Bottom Right) */}
      {!isCoPilotOpen && (
        <button
          onClick={() => setIsCoPilotOpen(true)}
          className="fixed bottom-6 right-6 z-40 px-4 py-2.5 rounded-full bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 text-graphite-950 font-mono text-xs font-bold shadow-2xl hover:scale-105 transition-all flex items-center space-x-2 border border-teal-300/50 group"
        >
          <div className="relative">
            <Bot className="w-4 h-4 text-graphite-950 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
          </div>
          <span>AI Co-Pilot</span>
          <Sparkles className="w-3.5 h-3.5 text-graphite-900" />
        </button>
      )}

      {/* AI Grid Co-Pilot Console */}
      <AIGridCoPilot
        isOpen={isCoPilotOpen}
        onClose={() => setIsCoPilotOpen(false)}
      />

      <footer className="border-t border-graphite-800/60 bg-graphite-950/80 backdrop-blur-md py-4 text-center font-mono text-xs text-graphite-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="text-graphite-400 font-semibold">ENERGYSIGHT AI</span> © 2026 — Real ML Pipeline & Forecasting Engine
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span className="text-teal-400">FastAPI ML Backend</span>
            <span>•</span>
            <span className="text-cyan-400">Next.js 14 Dashboard</span>
            <span>•</span>
            <span className="text-amber-400">Autonomous AI Co-Pilot</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
