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
  return (
    <div
      className={`
        i-card-white p-6 relative overflow-hidden
        ${hoverEffect ? 'hover:-translate-y-1' : ''}
        ${className}
      `}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}
