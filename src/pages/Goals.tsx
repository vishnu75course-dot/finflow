
import React, { useState, useEffect } from 'react';
import { Target, Plus, Trophy, ChevronRight, X } from 'lucide-react';
import { useData } from '../DataContext';
import { useSearchParams } from 'react-router-dom';

export default function Goals() {
  const { goals, addGoal, updateGoal, loading, user } = useData();
  const currency = user?.currency || '₹';
  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddMoneyModalOpen, setIsAddMoneyModalOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState(0);
  const [newGoal, setNewGoal] = useState({ title: '', target: 0, current: 0 });

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsModalOpen(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('action');
      setSearchParams(newParams);
    }
  }, [searchParams, setSearchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title || newGoal.target <= 0) return;
    await addGoal(newGoal);
    setIsModalOpen(false);
    setNewGoal({ title: '', target: 0, current: 0 });
  };

  const handleAddMoneySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalId || addAmount <= 0) return;
    const goal = goals.find(g => g.id === selectedGoalId);
    if (goal) {
      await updateGoal(selectedGoalId, { current: goal.current + addAmount });
      setIsAddMoneyModalOpen(false);
      setAddAmount(0);
      setSelectedGoalId(null);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Financial Goals</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-brand-accent text-white px-4 py-2.5 rounded-xl font-bold shadow-md hover:bg-brand-accent-hover transition-all active:scale-95"
        >
          <Plus size={18} />
          <span>New Goal</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {goals.map((goal) => {
            const percent = (goal.current / goal.target) * 100;
            return (
              <div key={goal.id} className="glass-card p-6 flex flex-col sm:flex-row gap-6">
                <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <div className="text-3xl">
                    {goal.title.toLowerCase().includes('laptop') ? '💻' : goal.title.toLowerCase().includes('trip') ? '✈️' : '🎯'}
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{goal.title}</h3>
                      <p className="text-sm text-slate-500 font-medium">Target: {currency}{goal.target.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-brand-accent">{Math.round(percent)}%</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand-accent rounded-full transition-all duration-1000" 
                        style={{ width: `${Math.min(percent, 100)}%` }} 
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-bold text-slate-600">{currency}{goal.current.toLocaleString()} saved</p>
                      <button 
                        onClick={() => {
                          setSelectedGoalId(goal.id);
                          setIsAddMoneyModalOpen(true);
                        }}
                        className="text-brand-accent font-bold text-xs hover:underline cursor-pointer"
                      >
                        Add Money
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-6">
          <div className="glass-card p-8 bg-slate-900 text-white border-none shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/20 rounded-full blur-3xl" />
             <div className="relative z-10 flex flex-col h-full">
               <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white">
                     <Trophy size={24} />
                  </div>
                  <h4 className="text-lg font-bold">Goal Analysis</h4>
               </div>
               <p className="text-slate-300 text-sm font-medium leading-relaxed mb-8">
                 You're on track! Based on your current monthly savings, you will reach your "Laptop Purchase" goal in 3 months.
               </p>
               <div className="mt-auto flex justify-between items-end">
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Savings Velocity</p>
                    <p className="text-2xl font-bold text-emerald-400">+12.5%</p>
                  </div>
                  <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-bold text-xs transition-colors">
                    View Details
                  </button>
               </div>
             </div>
          </div>

          <div 
            onClick={() => setIsModalOpen(true)}
            className="glass-card p-8 border-2 border-dashed border-slate-200 bg-transparent flex flex-col items-center justify-center py-12 gap-4 group cursor-pointer hover:border-brand-accent hover:bg-indigo-50/20 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-brand-accent group-hover:text-white transition-all">
               <Plus size={24} />
            </div>
            <div className="text-center">
              <h5 className="font-bold text-slate-900">Add New Goal</h5>
              <p className="text-xs text-slate-500 font-medium">Small steps lead to big milestones.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Money Modal */}
      {isAddMoneyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="text-lg font-bold text-slate-900">Add Savings</h3>
               <button onClick={() => setIsAddMoneyModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
                 <X size={20} />
               </button>
            </div>
            <form onSubmit={handleAddMoneySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Amount ({currency})</label>
                <input 
                  type="number" 
                  required
                  autoFocus
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-hidden"
                  value={addAmount || ''}
                  onChange={(e) => setAddAmount(Number(e.target.value))}
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-brand-accent text-white py-3 rounded-xl font-bold shadow-lg hover:bg-brand-accent-hover transition-all active:scale-95"
              >
                Add Savings
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="text-lg font-bold text-slate-900">Set Financial Goal</h3>
               <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
                 <X size={20} />
               </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Goal Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. New Laptop, Trip to Goa"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-hidden"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Target Amount ({currency})</label>
                  <input 
                    type="number" 
                    required
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-hidden"
                    value={newGoal.target || ''}
                    onChange={(e) => setNewGoal({ ...newGoal, target: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Initial Savings ({currency})</label>
                  <input 
                    type="number" 
                    required
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-hidden"
                    value={newGoal.current || ''}
                    onChange={(e) => setNewGoal({ ...newGoal, current: Number(e.target.value) })}
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-brand-accent text-white py-3 rounded-xl font-bold shadow-lg hover:bg-brand-accent-hover transition-all active:scale-95"
              >
                Create Goal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
