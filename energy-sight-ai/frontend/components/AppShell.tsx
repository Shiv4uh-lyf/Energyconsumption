'use client';

import React, { useState } from 'react';
import { SidebarNav, TopHeaderBar } from '@/components/Navbar';
import { AIGridCoPilot } from '@/components/AIGridCoPilot';
import { ExecutiveReportModal } from '@/components/ExecutiveReportModal';
import { Bot, Sparkles, Plus } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isCoPilotOpen, setIsCoPilotOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  return (
    <div className="relative z-10 max-w-[1440px] mx-auto min-h-[calc(100vh-3rem)]">
      
      {/* Outer Glassmorphic Main Container */}
      <div className="i-glass-wrapper p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-3rem)] flex gap-6">
        
        {/* Left Floating Sidebar Navigation */}
        <SidebarNav />

        {/* Right Main Content Workspace Area */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Top Header Greeting & Quick Actions */}
          <TopHeaderBar 
            onOpenCoPilot={() => setIsCoPilotOpen(true)}
            onOpenCreateModal={() => setIsReportModalOpen(true)}
          />

          {/* Main Page Workspace Content */}
          <main className="flex-1">
            {children}
          </main>

          {/* Footer Bar */}
          <footer className="mt-8 pt-4 border-t border-zinc-200/60 flex flex-col sm:flex-row items-center justify-between text-xs font-medium text-zinc-400 gap-2">
            <div>
              <span className="font-bold text-zinc-800">EnerSight AI</span> © 2026 — Real ML Forecasting & Grid Intelligence
            </div>
            <div className="flex items-center space-x-3 text-[11px]">
              <span>FastAPI Backend</span>
              <span>•</span>
              <span>Next.js 14 Dashboard</span>
              <span>•</span>
              <span>Autonomous AI CoPilot</span>
            </div>
          </footer>

        </div>
      </div>

      {/* Floating Co-Pilot Summon Button (Bottom Right) */}
      {!isCoPilotOpen && (
        <button
          onClick={() => setIsCoPilotOpen(true)}
          className="fixed bottom-8 right-8 z-40 px-4 py-3 rounded-full bg-[#121212] text-white font-semibold text-xs shadow-2xl hover:scale-105 transition-all flex items-center space-x-2 border border-zinc-700 group"
        >
          <div className="relative">
            <Bot className="w-4 h-4 text-teal-400 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <span>AI Co-Pilot</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        </button>
      )}

      {/* AI Grid Co-Pilot Modal */}
      <AIGridCoPilot
        isOpen={isCoPilotOpen}
        onClose={() => setIsCoPilotOpen(false)}
      />

      {/* Executive Audit / Forecast Modal */}
      <ExecutiveReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

    </div>
  );
}
