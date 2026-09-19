'use client';

import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'teal' | 'amber' | 'cyan' | 'rose' | 'none';
  hoverEffect?: boolean;
}

export function GlassCard({
  children,
  className = '',
  glow = 'none',
  hoverEffect = true,
}: GlassCardProps) {
  const glowStyles = {
    teal: 'hover:shadow-[0_0_25px_rgba(20,184,166,0.2)] hover:border-teal-500/40',
    amber: 'hover:shadow-[0_0_25px_rgba(245,158,11,0.2)] hover:border-amber-500/40',
    cyan: 'hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] hover:border-cyan-500/40',
    rose: 'hover:shadow-[0_0_25px_rgba(244,63,94,0.2)] hover:border-rose-500/40',
    none: '',
  };

  return (
    <div
      className={`
        relative backdrop-blur-xl bg-graphite-900/70 border border-graphite-800/80 rounded-xl 
        shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] transition-all duration-300
        ${hoverEffect ? 'hover:-translate-y-0.5' : ''}
        ${glowStyles[glow]}
        ${className}
      `}
    >
      {/* Translucent overlay highlight */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
