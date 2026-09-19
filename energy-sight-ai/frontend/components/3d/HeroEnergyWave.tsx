'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Zap, Eye, Activity, RefreshCw } from 'lucide-react';

interface DataPoint {
  timestamp: string;
  actual?: number;
  predicted?: number;
  lower_ci?: number;
  upper_ci?: number;
  is_anomaly?: boolean;
}

interface HeroEnergyWaveProps {
  data: DataPoint[];
  selectedModel?: string;
  horizon?: number;
  onRefresh?: () => void;
}

export function HeroEnergyWave({
  data,
  selectedModel = 'Ensemble',
  horizon = 24,
  onRefresh,
}: HeroEnergyWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      if (containerRef.current && canvas) {
        const rect = containerRef.current.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };

    resize();
    window.addEventListener('resize', resize);

    // Compute min/max for scaling
    const values = data.map((d) => d.actual ?? d.predicted ?? 0);
    const minVal = Math.min(...values) * 0.9;
    const maxVal = Math.max(...values) * 1.1;

    const draw = () => {
      if (!canvas || !containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      ctx.clearRect(0, 0, width, height);

      time += 0.02;

      // Draw perspective grid background
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1;
      const gridSpacing = 40;
      for (let x = 0; x < width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw 3D-like glowing energy wave lines
      const padding = { top: 40, bottom: 40, left: 50, right: 30 };
      const plotW = width - padding.left - padding.right;
      const plotH = height - padding.top - padding.bottom;

      const getX = (index: number) => padding.left + (index / (data.length - 1)) * plotW;
      const getY = (val: number) => padding.top + plotH - ((val - minVal) / (maxVal - minVal)) * plotH;

      // Render confidence interval area for predictions
      ctx.fillStyle = 'rgba(20, 184, 166, 0.08)';
      ctx.beginPath();
      let started = false;
      data.forEach((d, i) => {
        if (d.upper_ci !== undefined) {
          const x = getX(i);
          const yUpper = getY(d.upper_ci);
          if (!started) {
            ctx.moveTo(x, yUpper);
            started = true;
          } else {
            ctx.lineTo(x, yUpper);
          }
        }
      });
      for (let i = data.length - 1; i >= 0; i--) {
        const d = data[i];
        if (d.lower_ci !== undefined) {
          const x = getX(i);
          const yLower = getY(d.lower_ci);
          ctx.lineTo(x, yLower);
        }
      }
      ctx.closePath();
      ctx.fill();

      // Render actual line (emerald glowing wave)
      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#10b981'; // emerald-500
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 10;
      let actualCount = 0;
      data.forEach((d, i) => {
        if (d.actual !== undefined) {
          actualCount++;
          const x = getX(i);
          const y = getY(d.actual) + Math.sin(time + i * 0.1) * 1.5; // micro pulsation
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Render forecast line (cyan dashed glowing line)
      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#06b6d4'; // cyan-500
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 12;
      ctx.setLineDash([6, 4]);
      let firstForecast = true;
      data.forEach((d, i) => {
        if (d.predicted !== undefined) {
          const x = getX(i);
          const y = getY(d.predicted) + Math.cos(time + i * 0.1) * 1.5;
          if (firstForecast) {
            ctx.moveTo(x, y);
            firstForecast = false;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      // Render connection point (Current load pulse)
      if (actualCount > 0 && actualCount <= data.length) {
        const splitIdx = actualCount - 1;
        const cx = getX(splitIdx);
        const cy = getY(data[splitIdx].actual ?? 0);

        // Pulsing ring around current point
        const pulseR = 8 + Math.sin(time * 4) * 4;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Anomaly highlights
      data.forEach((d, i) => {
        if (d.is_anomaly && d.actual !== undefined) {
          const ax = getX(i);
          const ay = getY(d.actual);
          ctx.fillStyle = '#f43f5e'; // rose-500
          ctx.beginPath();
          ctx.arc(ax, ay, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'rgba(244, 63, 94, 0.5)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(ax, ay, 10 + Math.sin(time * 5) * 3, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [data]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || data.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const paddingLeft = 50;
    const paddingRight = 30;
    const plotW = rect.width - paddingLeft - paddingRight;

    const ratio = Math.max(0, Math.min(1, (x - paddingLeft) / plotW));
    const idx = Math.round(ratio * (data.length - 1));
    if (data[idx]) {
      setHoveredPoint(data[idx]);
      setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  return (
    <div className="relative w-full h-[420px] rounded-xl bg-graphite-950 border border-graphite-800/80 overflow-hidden shadow-2xl">
      {/* Top Overlay Controls */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-3 bg-graphite-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-graphite-800">
          <Activity className="w-4 h-4 text-teal-400 animate-pulse" />
          <span className="font-mono text-xs text-graphite-200 font-semibold">
            3D ENERGY SURFACE WAVE
          </span>
          <span className="text-xs text-graphite-400 font-mono">
            Model: <span className="text-teal-300 font-medium">{selectedModel}</span>
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-3 px-3 py-1.5 rounded-lg bg-graphite-900/90 backdrop-blur-md border border-graphite-800 text-xs font-mono">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="text-graphite-300">Historical</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              <span className="text-graphite-300">AI Forecast ({horizon}h)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
              <span className="text-graphite-300">Anomaly</span>
            </span>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 rounded-lg bg-graphite-900/90 hover:bg-graphite-800 border border-graphite-800 text-graphite-300 hover:text-white transition-colors"
              title="Refresh Forecast Wave"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Interactive Canvas Container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          setHoveredPoint(null);
          setHoverPos(null);
        }}
        className="w-full h-full cursor-crosshair"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Interactive Tooltip */}
      {hoveredPoint && hoverPos && (
        <div
          style={{
            left: Math.min(hoverPos.x + 15, containerRef.current ? containerRef.current.clientWidth - 220 : hoverPos.x),
            top: Math.max(10, hoverPos.y - 80),
          }}
          className="absolute z-30 pointer-events-none bg-graphite-900/95 backdrop-blur-xl border border-teal-500/40 rounded-lg p-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] font-mono text-xs min-w-[200px]"
        >
          <div className="text-graphite-400 mb-1 border-b border-graphite-800 pb-1">
            {new Date(hoveredPoint.timestamp).toLocaleString()}
          </div>
          {hoveredPoint.actual !== undefined && (
            <div className="flex justify-between text-emerald-400 my-0.5">
              <span>Actual Load:</span>
              <span className="font-bold">{hoveredPoint.actual.toFixed(2)} kW</span>
            </div>
          )}
          {hoveredPoint.predicted !== undefined && (
            <div className="flex justify-between text-cyan-400 my-0.5">
              <span>Forecast:</span>
              <span className="font-bold">{hoveredPoint.predicted.toFixed(2)} kW</span>
            </div>
          )}
          {hoveredPoint.lower_ci !== undefined && hoveredPoint.upper_ci !== undefined && (
            <div className="flex justify-between text-teal-300/80 text-[10px] mt-1 border-t border-graphite-800 pt-1">
              <span>95% CI:</span>
              <span>
                [{hoveredPoint.lower_ci.toFixed(1)} - {hoveredPoint.upper_ci.toFixed(1)}]
              </span>
            </div>
          )}
          {hoveredPoint.is_anomaly && (
            <div className="mt-1 text-rose-400 font-semibold text-[10px] flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              <span>UNUSUAL ANOMALY DETECTED</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
