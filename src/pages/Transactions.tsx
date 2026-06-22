
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Plus, Trash2, ArrowUpRight, ArrowDownRight, X, Edit2 } from 'lucide-react';
import { useData } from '../DataContext';
import { Transaction } from '../types';
import { useSearchParams } from 'react-router-dom';

export default function Transactions() {
  const { transactions, addTransaction, updateTransaction, deleteTransaction, loading, user } = useData();
  const currency = user?.currency || '₹';
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterTab, setFilterTab] = useState<'month' | 'category'>('month');
  const [editingTxId, setEditingTxId] = useState<string | null>(null);

  // Standardized month key helper
  const getMonthKey = React.useCallback((dateStr: string) => {
    const d = new Date(dateStr);
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear().toString().slice(-2);
    return `${month} ${year}`;
  }, []);

  const [newTx, setNewTx] = useState<Omit<Transaction, 'id'>>({
    title: '',
    amount: 0,
    type: 'expense',
    category: 'Food',
    date: new Date().toISOString().split('T')[0]
  });

  // Get unique categories for filtering
  const categories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category));
    return Array.from(cats).sort();
  }, [transactions]);

  // Get unique months for filtering
  const monthOptions = useMemo(() => {
    const list = transactions.map(t => {
      const d = new Date(t.date);
      return {
        label: getMonthKey(t.date),
        timestamp: new Date(d.getFullYear(), d.getMonth(), 1).getTime()
      };
    });
    
    const unique = Array.from(new Map<string, number>(list.map(item => [item.label, item.timestamp])).entries())
      .sort((a, b) => b[1] - a[1]);
      
    return unique.map(([label]) => label);
  }, [transactions, getMonthKey]);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsModalOpen(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('action');
      setSearchParams(newParams);
    }
    
    const typeParam = searchParams.get('type');
    if (typeParam === 'income' || typeParam === 'expense') {
      setFilterType(typeParam);
    }

    const catParam = searchParams.get('category');
    if (catParam) {
      setFilterCategory(catParam);
    }
  }, [searchParams, setSearchParams]);

  const filtered = transactions.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    
    const txMonth = getMonthKey(t.date);
    const matchesMonth = filterMonth === 'all' || txMonth === filterMonth;
    
    return matchesSearch && matchesType && matchesCategory && matchesMonth;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.title || newTx.amount <= 0) return;
    
    if (editingTxId) {
      await updateTransaction(editingTxId, newTx);
    } else {
      await addTransaction(newTx);
    }
    
    setIsModalOpen(false);
    setEditingTxId(null);
    setNewTx({
      title: '',
      amount: 0,
      type: 'expense',
      category: 'Food',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleEdit = (tx: Transaction) => {
    setNewTx({
      title: tx.title,
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      date: tx.date
    });
    setEditingTxId(tx.id);
    setIsModalOpen(true);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Transactions</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-brand-accent text-white px-4 py-2.5 rounded-xl font-bold shadow-md hover:bg-brand-accent-hover transition-all active:scale-95"
        >
          <Plus size={18} />
          <span>Add Transaction</span>
        </button>
      </div>

      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search transactions..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-hidden transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
            <button 
              onClick={() => setFilterType('all')}
              className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilterType('income')}
              className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Income
            </button>
            <button 
              onClick={() => setFilterType('expense')}
              className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Expenses
            </button>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-xl transition-all cursor-pointer ${showFilters || filterCategory !== 'all' || filterMonth !== 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              <Filter size={20} />
            </button>

            {showFilters && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-10 transition-all">
                <div className="flex items-center justify-between p-2 border-b border-slate-50 mb-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Transaction Filters</p>
                  {(filterCategory !== 'all' || filterMonth !== 'all') && (
                    <button 
                      onClick={() => { setFilterCategory('all'); setFilterMonth('all'); setShowFilters(false); }}
                      className="text-[10px] font-bold text-rose-500 hover:underline px-1 cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="flex border-b border-slate-100 mb-3">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setFilterTab('month'); }}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${filterTab === 'month' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Timeline
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setFilterTab('category'); }}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${filterTab === 'category' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Categories
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto p-1">
                  {filterTab === 'month' ? (
                    <section className="space-y-1">
                      <button
                        onClick={() => { setFilterMonth('all'); setShowFilters(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${filterMonth === 'all' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-600'}`}
                      >
                        All History
                      </button>
                      {monthOptions.map(m => (
                        <button
                          key={m}
                          onClick={() => { setFilterMonth(m); setShowFilters(false); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${filterMonth === m ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-600'}`}
                        >
                          {m}
                        </button>
                      ))}
                    </section>
                  ) : (
                    <section className="space-y-1">
                      <button
                        onClick={() => { setFilterCategory('all'); setShowFilters(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${filterCategory === 'all' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-600'}`}
                      >
                        All Categories
                      </button>
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => { setFilterCategory(cat); setShowFilters(false); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${filterCategory === cat ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-600'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </section>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Transaction</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{tx.title}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                      {tx.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className={`font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {tx.type === 'income' ? '+' : '-'}{currency}{tx.amount.toLocaleString()}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                      tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${tx.type === 'income' ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                      Completed
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                    {new Date(tx.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(tx)}
                        className="p-2 text-slate-300 hover:text-brand-accent transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => deleteTransaction(tx.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-slate-500 font-medium">No transactions found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="text-lg font-bold text-slate-900">{editingTxId ? 'Edit Transaction' : 'Add Transaction'}</h3>
               <button onClick={() => { setIsModalOpen(false); setEditingTxId(null); }} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
                 <X size={20} />
               </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setNewTx({ ...newTx, type: 'income' })}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${newTx.type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Income
                </button>
                <button
                  type="button"
                  onClick={() => setNewTx({ ...newTx, type: 'expense' })}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${newTx.type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Expense
                </button>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Swiggy Lunch"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-hidden"
                  value={newTx.title}
                  onChange={(e) => setNewTx({ ...newTx, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Amount ({currency})</label>
                  <input 
                    type="number" 
                    required
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-hidden"
                    value={newTx.amount || ''}
                    onChange={(e) => setNewTx({ ...newTx, amount: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-hidden"
                    value={newTx.category}
                    onChange={(e) => setNewTx({ ...newTx, category: e.target.value })}
                  >
                    <option>Food</option>
                    <option>Travel</option>
                    <option>Shopping</option>
                    <option>Salary</option>
                    <option>Entertainment</option>
                    <option>Utilities</option>
                    <option>Others</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Date</label>
                <input 
                  type="date" 
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-hidden"
                  value={newTx.date}
                  onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-brand-accent text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-brand-accent-hover transition-all active:scale-95"
              >
                {editingTxId ? 'Update Transaction' : 'Add Transaction'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
