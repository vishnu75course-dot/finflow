
import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, Plus, Calendar, AlertTriangle, Info, CheckCircle, X } from 'lucide-react';

import { Link, useLocation } from 'react-router-dom';
import { useData } from '../DataContext';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const { notifications } = useData();
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setShowNotifications(false);
  }, [location.pathname]);

  const pageTitle = React.useMemo(() => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path === '/transactions') return 'Ledger';
    if (path === '/budgets') return 'Allocations';
    if (path === '/insights') return 'Intelligence';
    if (path === '/goals') return 'Milestones';
    if (path === '/settings') return 'Control Panel';
    if (path === '/reminders') return 'Bill Reminders';
    return 'Financial Node';
  }, [location.pathname]);

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-slate-900">{pageTitle}</h2>
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-slate-500 text-xs font-semibold">
          <Calendar size={14} />
          <span>{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <Link 
            to="/transactions?action=new" 
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition-all active:scale-95"
          >
            <Plus size={18} />
            <span>New Entry</span>
          </Link>
          
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2.5 rounded-xl transition-all relative cursor-pointer ${showNotifications ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold bg-rose-500 text-white rounded-full border-2 border-white px-1">
                  {notifications.length}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden ring-1 ring-black/5"
                >
                  <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Node Signal Alerts</h3>
                    <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-[10px] font-black">{notifications.length}</span>
                  </div>

                  <div className="max-h-[350px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-10 text-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircle className="text-slate-300" size={24} />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Alerts Detected</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {notifications.map((notif) => (
                          <div key={notif.id} className="p-4 hover:bg-slate-50 transition-colors group">
                            <div className="flex gap-3">
                              <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                notif.type === 'alert' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'
                              }`}>
                                <AlertTriangle size={16} />
                              </div>
                              <div className="flex-1">
                                <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{notif.title}</h4>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{notif.message}</p>
                                <span className="text-[10px] font-bold text-slate-400 mt-2 block uppercase tracking-tighter">Just now • {notif.category}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <Link 
                      to="/reminders"
                      className="block p-3 text-center text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 border-t border-slate-100 transition-all"
                    >
                      Review Reminders
                    </Link>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
