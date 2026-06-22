
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Sparkles, MessageSquare, Lightbulb, TrendingUp, AlertCircle } from 'lucide-react';
import { useData } from '../DataContext';
import { sendChatMessage } from '../services/api';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

export default function Insights() {
  const { insights, user, loading, token, chatMessages, setChatMessages } = useData();
  const currency = user?.currency || '₹';
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !token) return;

    const userMsg = input.trim();
    const currentMessages = [...chatMessages, { role: 'user', text: userMsg } as Message];
    setChatMessages(currentMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(userMsg, currentMessages.map(m => ({
        role: m.role === 'user' ? 'user' : 'ai',
        text: m.text
      })), token);
      setChatMessages(prev => [...prev, { role: 'ai', text: response.reply }]);
    } catch (error) {
      console.error(error);
      setChatMessages(prev => [...prev, { role: 'ai', text: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-brand-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-160px)]">
      <div className="lg:col-span-1 space-y-6 overflow-y-auto pr-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Financial Insights</h2>
          <p className="text-sm text-slate-500 font-medium">Personalized recommendations based on your data.</p>
        </div>

        <div className="space-y-4">
          <div className="glass-card p-4 border-l-4 border-brand-accent bg-indigo-50/30">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-brand-accent" />
              <span className="text-xs font-bold text-brand-accent uppercase tracking-wider">Savings Opportunity</span>
            </div>
            <p className="text-sm font-medium text-slate-700">
              You could save an estimated <span className="text-slate-900 font-bold">{currency}2,400</span> this month by reducing dining out by 20%.
            </p>
          </div>

          {insights.map((insight) => (
            <div key={insight.id} className="glass-card p-4 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                {insight.type === 'warning' ? (
                  <AlertCircle size={16} className="text-rose-500" />
                ) : (
                  <Lightbulb size={16} className="text-amber-500" />
                )}
                <span className={`text-[10px] font-black uppercase tracking-widest ${insight.type === 'warning' ? 'text-rose-500' : 'text-amber-500'}`}>
                  {insight.type === 'warning' ? 'Spending Alert' : 'Smart Tip'}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-700">{insight.message}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2 flex flex-col glass-card overflow-hidden h-full">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-accent flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">FinFlow AI</h3>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online & Analyzing
              </p>
            </div>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {chatMessages.map((msg, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${msg.role === 'user' ? 'bg-indigo-100 text-brand-accent' : 'bg-slate-100 text-slate-600'}`}>
                   {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-brand-accent text-white font-medium' : 'bg-slate-100 text-slate-700 font-medium'}`}>
                  {msg.text}
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
               <div className="flex gap-3 items-center bg-slate-50 p-4 rounded-2xl">
                 <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-duration:0.6s]" />
                 <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:-0.2s]" />
                 <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:-0.4s]" />
               </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Ask anything about your finances..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-hidden transition-all"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              disabled={isLoading}
              className="absolute right-2 top-1.5 p-1.5 bg-brand-accent text-white rounded-lg hover:bg-brand-accent-hover transition-colors disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
