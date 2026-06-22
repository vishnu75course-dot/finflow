
import React from 'react';
import { motion } from 'motion/react';
import { User, Mail, Shield, Wallet, Calendar, MapPin, Award, Activity, CreditCard, ChevronRight } from 'lucide-react';

import { useData } from '../DataContext';

export default function Profile() {
  const { user } = useData();

  const displayName = user?.name || 'User';
  const initial = displayName[0].toUpperCase();
  const email = user?.email || '';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header Profile Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-0 flex flex-col md:flex-row overflow-hidden border-none shadow-2xl shadow-slate-200 bg-white"
      >
        <div className="md:w-1/3 bg-slate-900 p-10 flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none grayscale group-hover:grayscale-0 transition-all duration-700">
             <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-indigo-500 rounded-full blur-[60px]" />
          </div>
          
          <div className="relative z-10">
            <div className="w-32 h-32 rounded-[40px] bg-indigo-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl mb-6 mx-auto border-4 border-slate-800 ring-4 ring-indigo-500/20 group-hover:rotate-6 transition-transform duration-500">
              {initial}
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tight">{displayName}</h3>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mt-2 bg-indigo-500/10 px-3 py-1.5 rounded-full inline-block border border-indigo-500/20">Verified Account</p>
          </div>
        </div>

        <div className="md:w-2/3 p-8 md:p-12 space-y-8 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Mail size={12} /> Email Address
              </p>
              <p className="font-bold text-slate-900 border-b border-slate-100 pb-2">{email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={12} /> Member Since
              </p>
              <p className="font-bold text-slate-900 border-b border-slate-100 pb-2">January, 2024</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={12} /> Location
              </p>
              <p className="font-bold text-slate-900 border-b border-slate-100 pb-2">India</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Shield size={12} /> Security Level
              </p>
              <p className="font-bold text-indigo-600 border-b border-indigo-50 pb-2">Advanced Protection</p>
            </div>
          </div>

          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 relative overflow-hidden group hover:border-indigo-100 transition-colors duration-300">
             <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Active Subscription</h4>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-400/10 px-3 py-1 rounded-full">Premium Active</span>
             </div>
             <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center text-indigo-600 border border-slate-100">
                  <CreditCard size={28} />
                </div>
                <div className="flex-1">
                   <p className="text-lg font-black text-slate-900 uppercase tracking-tight">FinFlow Pro Plan</p>
                   <p className="text-xs text-slate-500 font-medium">₹999.00/Month • Next billing June 1, 2026</p>
                </div>
                <button className="p-2 hover:bg-white rounded-xl transition-colors">
                  <ChevronRight size={20} className="text-slate-400" />
                </button>
             </div>
          </div>
        </div>
      </motion.div>

      {/* Grid sections for stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Activity, label: "Account Health", value: "98.2%", color: "text-emerald-500" },
          { icon: Wallet, label: "Accounts Linked", value: "4 Accounts", color: "text-indigo-500" },
          { icon: Award, label: "Achievement Tier", value: "Elite Saver", color: "text-amber-500" }
        ].map((item, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + (i * 0.1) }}
            className="glass-card p-6 border-none shadow-xl shadow-slate-200 bg-white group hover:shadow-indigo-500/10 transition-all duration-500"
          >
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 mb-4 group-hover:text-indigo-600 transition-colors border border-slate-100 group-hover:bg-white group-hover:shadow-lg transition-all duration-300">
              <item.icon size={20} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
            <h4 className={`text-2xl font-black mt-1 ${item.color}`}>{item.value}</h4>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
