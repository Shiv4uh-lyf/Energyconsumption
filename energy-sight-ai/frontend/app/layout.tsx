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
    <html lang="en" className="dark scroll-smooth">
      <body className="bg-graphite-950 text-graphite-100 font-sans antialiased min-h-screen selection:bg-teal-500/30 selection:text-teal-200 overflow-x-hidden">
        
        {/* Futuristic Background Atmospheric Glows */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-25" />
        </div>

        <AppShell>{children}</AppShell>

      </body>
    </html>
  );
}
