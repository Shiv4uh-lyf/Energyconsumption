'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  Zap, 
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
    const query = queryText || inputQuery;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    setLoading(true);

    try {
      const res = await api.askCoPilot(query);
      const copilotMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'copilot',
        text: res.answer,
        category: res.category || 'AI Analysis',
        suggested_actions: res.suggested_actions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        data_summary: res.data_summary,
      };
      setMessages((prev) => [...prev, copilotMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'copilot',
        text: "⚠ Could not process query via backend. Make sure FastAPI server is active on localhost:8000.",
        category: 'Error',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`w-full bg-[#121212] text-white rounded-3xl border border-zinc-700 shadow-2xl flex flex-col transition-all duration-300 overflow-hidden ${
          isExpanded ? 'max-w-4xl h-[85vh]' : 'max-w-xl h-[600px]'
        }`}
      >
        
        {/* Modal Header */}
        <div className="p-4 bg-[#18181b] border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-teal-500 text-[#121212] flex items-center justify-center font-extrabold shadow-md">
              <Bot className="w-5 h-5 text-[#121212]" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center space-x-1.5">
                <span>Autonomous AI Grid Co-Pilot</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h2>
              <p className="text-[11px] font-bold text-teal-400">
                Connected to FastAPI Inference Engine
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl space-y-2 ${
                  msg.sender === 'user'
                    ? 'bg-teal-500 text-[#121212] font-bold shadow-md'
                    : 'bg-[#1c1c24] text-white border border-zinc-800 shadow-md'
                }`}
              >
                {msg.category && msg.sender === 'copilot' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-teal-500/20 text-teal-300 border border-teal-500/40 inline-block mb-1">
                    {msg.category}
                  </span>
                )}

                <div className="leading-relaxed whitespace-pre-line text-xs font-semibold">
                  {msg.text}
                </div>

                {/* Suggested Follow-up Actions */}
                {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                  <div className="pt-2 border-t border-zinc-700 flex flex-wrap gap-1.5">
                    {msg.suggested_actions.map((act) => (
                      <button
                        key={act}
                        onClick={() => handleSend(act)}
                        className="px-3 py-1 rounded-xl bg-white text-[#121212] hover:bg-zinc-200 font-extrabold text-[11px] transition-all flex items-center space-x-1 shadow-sm"
                      >
                        <Zap className="w-3 h-3 text-teal-600 fill-teal-600" />
                        <span>{act}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <span className="text-[10px] font-bold text-zinc-400 mt-1 px-1">
                {msg.timestamp}
              </span>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-teal-400 text-xs font-bold p-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing telemetry distribution & neural models...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-[#18181b] border-t border-zinc-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <div className="relative flex-1">
              <Terminal className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask Co-Pilot (e.g. 'When is peak load?', 'Which model is best?')"
                className="w-full bg-[#121212] text-xs font-bold text-white pl-9 pr-3 py-2.5 rounded-xl border border-zinc-700 focus:outline-none focus:border-teal-400 placeholder-zinc-500"
              />
            </div>
            <button
              type="submit"
              disabled={!inputQuery.trim() || loading}
              className="p-2.5 rounded-xl bg-teal-400 text-[#121212] hover:bg-teal-300 font-extrabold disabled:opacity-40 transition-colors shadow-lg"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
