
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  PieChart, 
  Lightbulb, 
  Target, 
  Settings, 
  Wallet,
  LogOut,
  Bell
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useData } from '../DataContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: ArrowRightLeft, label: 'Transactions', path: '/transactions' },
  { icon: Wallet, label: 'Budgets', path: '/budgets' },
  { icon: Lightbulb, label: 'AI Insights', path: '/insights' },
  { icon: Target, label: 'Goals', path: '/goals' },
  { icon: Bell, label: 'Reminders', path: '/reminders' },
  { icon: PieChart, label: 'Reports', path: '/reports' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { logout, user } = useData();
  const displayName = user?.name || 'User';
  const displayInitial = displayName.charAt(0).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-64 h-screen bg-slate-900 text-slate-300 flex flex-col fixed left-0 top-0 overflow-y-auto border-r border-slate-800">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center text-white font-bold">
          <Wallet size={18} />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight uppercase">FinFlow</h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group text-slate-400 font-medium",
              isActive ? "bg-brand-accent text-white" : "hover:bg-slate-800 hover:text-white"
            )}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <button 
          onClick={handleLogout}
          className="w-full bg-slate-800 rounded-xl p-3.5 border border-slate-700/50 flex items-center gap-3 hover:bg-slate-700/50 hover:border-rose-500/30 transition-all group cursor-pointer"
          title="Logout"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black group-hover:rotate-6 transition-transform overflow-hidden">
            {user?.profileImage ? (
              <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              displayInitial
            )}
          </div>
          <div className="text-left flex-1 overflow-hidden">
            <p className="text-sm font-bold text-white truncate">{displayName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <LogOut size={10} className="text-rose-400" />
              <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest group-hover:text-rose-400 transition-colors">Logout</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
