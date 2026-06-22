
import React, { useState, useEffect } from 'react';
import { Wallet, Plus, AlertTriangle, CheckCircle2, ChevronRight, X, Edit2, Trash2 } from 'lucide-react';
import { useData } from '../DataContext';
import { useSearchParams, useNavigate } from 'react-router-dom';

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default function Budgets() {
  const { budgets, updateBudget, deleteBudget, loading, user } = useData();
  const currency = user?.currency || '₹';
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newBudget, setNewBudget] = useState({ category: 'Food', limit: 0 });

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsModalOpen(true);
      setIsEditing(false);
      setNewBudget({ category: 'Food', limit: 0 });
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('action');
      setSearchParams(newParams);
    }
  }, [searchParams, setSearchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newBudget.limit <= 0) return;
    await updateBudget(newBudget);
    setIsModalOpen(false);
    setIsEditing(false);
    setNewBudget({ category: 'Food', limit: 0 });
  };

  const handleEdit = (budget: any) => {
    setNewBudget({ category: budget.category, limit: budget.limit });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (category: string) => {
    await deleteBudget(category);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-brand-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Manage Budgets</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-brand-accent text-white px-4 py-2.5 rounded-xl font-bold shadow-md hover:bg-brand-accent-hover transition-all active:scale-95"
        >
          <Plus size={18} />
          <span>New Budget</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.map((budget) => {
          const percent = (budget.spent / budget.limit) * 100;
          let color = 'bg-brand-accent';
          if (percent > 100) color = 'bg-rose-500';
          else if (percent > 80) color = 'bg-amber-500';

          return (
            <div key={budget.category} className={cn(
              "glass-card p-6 border-t-4 transition-all duration-300",
              percent >= 100 ? "border-t-rose-500 shadow-lg shadow-rose-100" : 
              percent >= 85 ? "border-t-amber-500" : "border-t-transparent"
            )}>
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                    percent >= 100 ? "bg-rose-50 text-rose-600" : 
                    percent >= 85 ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-600"
                  )}>
                    <Wallet size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{budget.category}</h4>
                    <p className="text-xs text-slate-500">Scheduled Monthly</p>
                  </div>
                </div>
                <div className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                  percent >= 100 ? "bg-rose-100 text-rose-600" : 
                  percent >= 85 ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                )}>
                  {Math.round(percent)}%
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500 font-medium">Spent {currency}{budget.spent.toLocaleString()}</span>
                  <span className="font-bold text-slate-900">{currency}{budget.limit.toLocaleString()}</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-1000",
                      percent >= 100 ? "bg-rose-500" : 
                      percent >= 85 ? "bg-amber-500" : "bg-indigo-600"
                    )} 
                    style={{ width: `${Math.min(percent, 100)}%` }} 
                  />
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                    {percent >= 100 ? (
                      <>
                        <AlertTriangle size={14} className="text-rose-500" />
                        <span className="text-rose-500">Critical Breach</span>
                      </>
                    ) : percent >= 85 ? (
                      <>
                        <AlertTriangle size={14} className="text-amber-500" />
                        <span className="text-amber-500">Warning Zone</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <span className="text-emerald-500">Safe Zone</span>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEdit(budget)}
                      className="text-slate-400 hover:text-indigo-600 transition-colors p-1 cursor-pointer" 
                      title="Edit Budget"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(budget.category)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer" 
                      title="Delete Budget"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button 
                      onClick={() => navigate(`/transactions?category=${encodeURIComponent(budget.category)}`)}
                      className="text-slate-400 hover:text-indigo-600 transition-colors p-1 cursor-pointer"
                      title="View Transactions"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="text-lg font-bold text-slate-900">{isEditing ? 'Edit Budget' : 'Set New Budget'}</h3>
               <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
                 <X size={20} />
               </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                  value={newBudget.category}
                  onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                  disabled={isEditing}
                >
                  <option>Food</option>
                  <option>Travel</option>
                  <option>Shopping</option>
                  <option>Entertainment</option>
                  <option>Utilities</option>
                  <option>Others</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Monthly Limit ({currency})</label>
                <input 
                  type="number" 
                  required
                  placeholder="e.g. 5000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-hidden"
                  value={newBudget.limit || ''}
                  onChange={(e) => setNewBudget({ ...newBudget, limit: Number(e.target.value) })}
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-brand-accent text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-brand-accent-hover transition-all active:scale-95"
              >
                {isEditing ? 'Update Budget' : 'Create Budget'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

