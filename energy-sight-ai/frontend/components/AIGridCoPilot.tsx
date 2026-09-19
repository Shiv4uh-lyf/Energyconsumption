'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  Zap, 
  BarChart2, 
  AlertTriangle, 
  Sliders, 
  RefreshCw,
  Terminal,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { api } from '@/lib/api';

interface ChatMessage {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  category?: string;
  suggested_actions?: string[];
  timestamp: string;
  data_summary?: any;
}

interface AIGridCoPilotProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIGridCoPilot({ isOpen, onClose }: AIGridCoPilotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'copilot',
      text: "⚡ **Greetings Grid Operator!** I am your **Autonomous AI Grid Co-Pilot**.\n\nAsk me anything about telemetry trends, forecast peaks, anomaly alerts, model benchmarks, or peak-shaving simulations.",
      category: 'System Online',
      suggested_actions: ['When is peak load?', 'Which model has lowest error?', 'Show high severity anomalies', 'Simulate 15% demand response'],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await api.queryCoPilot(q);
      const botMsg: ChatMessage = {
        id: `c_${Date.now()}`,
        sender: 'copilot',
        text: res.answer,
        category: res.category,
        suggested_actions: res.suggested_actions,
        data_summary: res.data_summary,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `e_${Date.now()}`,
        sender: 'copilot',
        text: "⚠️ Couldn't reach backend intelligence engine. Ensure FastAPI server is running.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fixed z-50 transition-all duration-300 ${
      isExpanded 
        ? 'inset-4 m-auto max-w-5xl h-[90vh]' 
        : 'bottom-6 right-6 w-full max-w-lg h-[620px]'
    }`}>
      <div className="w-full h-full bg-graphite-950/95 border border-teal-500/40 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="p-3.5 bg-gradient-to-r from-graphite-900 via-graphite-950 to-teal-950/50 border-b border-graphite-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-400 shadow-md">
                <Bot className="w-4 h-4" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-graphite-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-mono text-xs font-bold text-white tracking-wider">AUTONOMOUS AI GRID CO-PILOT</h3>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">ONLINE</span>
              </div>
              <p className="text-[10px] font-mono text-graphite-400">Natural language telemetry query & operational intelligence engine</p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-graphite-400 hover:text-white hover:bg-graphite-800 transition-colors"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-graphite-400 hover:text-rose-400 hover:bg-graphite-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 no-scrollbar font-mono text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col space-y-1.5 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center space-x-1 text-[10px] text-graphite-500">
                <span>{msg.sender === 'user' ? 'Grid Operator' : 'AI Co-Pilot'}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>

              <div
                className={`p-3.5 rounded-2xl max-w-[88%] leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-teal-600 text-white rounded-tr-none shadow-md'
                    : 'bg-graphite-900 border border-graphite-800 text-graphite-200 rounded-tl-none space-y-2'
                }`}
              >
                {msg.category && msg.sender === 'copilot' && (
                  <div className="flex items-center space-x-1.5 text-[10px] font-bold text-teal-400 uppercase tracking-wider mb-1">
                    <Sparkles className="w-3 h-3" />
                    <span>{msg.category}</span>
                  </div>
                )}

                {/* Render Text with formatting */}
                <div className="whitespace-pre-wrap text-[11px]">
                  {msg.text}
                </div>

                {/* Data Summary Pill */}
                {msg.data_summary && (
                  <div className="pt-2 border-t border-graphite-800/80 flex flex-wrap gap-2 text-[10px]">
                    {Object.entries(msg.data_summary).map(([k, v]) => (
                      <span key={k} className="px-2 py-0.5 rounded bg-graphite-950 border border-graphite-800 text-cyan-300">
                        {k}: <strong className="text-white">{String(v)}</strong>
                      </span>
                    ))}
                  </div>
                )}

                {/* Suggested Follow-up Actions */}
                {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                  <div className="pt-2 border-t border-graphite-800/80 flex flex-wrap gap-1.5">
                    {msg.suggested_actions.map((act) => (
                      <button
                        key={act}
                        onClick={() => handleSend(act)}
                        className="px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] transition-colors flex items-center space-x-1"
                      >
                        <Zap className="w-3 h-3 text-teal-400" />
                        <span>{act}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-teal-400 text-xs font-mono p-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing telemetry distribution & neural models...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-graphite-900/90 border-t border-graphite-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <div className="relative flex-1">
              <Terminal className="w-4 h-4 text-graphite-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask Co-Pilot (e.g. 'When is peak load?', 'Best model accuracy?')"
                className="w-full bg-graphite-950 text-xs font-mono text-white pl-9 pr-3 py-2 rounded-xl border border-graphite-700 focus:outline-none focus:border-teal-500 placeholder-graphite-500"
              />
            </div>
            <button
              type="submit"
              disabled={!inputQuery.trim() || loading}
              className="p-2 rounded-xl bg-teal-500 text-graphite-950 hover:bg-teal-400 font-bold disabled:opacity-40 transition-colors shadow-lg"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
