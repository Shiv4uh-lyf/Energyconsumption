import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'EnerSight AI — Energy Consumption Forecasting & Intelligence Command',
  description: 'AI-powered energy consumption forecasting platform built with machine learning models and futuristic analytical command control.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-[#e6e9ef] text-[#121212] font-sans antialiased min-h-screen selection:bg-zinc-900 selection:text-white overflow-x-hidden ambient-silk-bg p-3 sm:p-6">
        
        {/* Soft Ambient Clay Light Orbs */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-white/70 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-zinc-300/40 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-slate-200/50 rounded-full blur-3xl" />
        </div>

        <AppShell>{children}</AppShell>

      </body>
    </html>
  );
}
