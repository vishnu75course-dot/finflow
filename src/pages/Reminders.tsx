import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useData } from '../DataContext';
import { Plus, Check, Clock, Trash2, IndianRupee, Bell } from 'lucide-react';
import { Reminder } from '../types';

export default function Reminders() {
  const { reminders, addReminder, updateReminder, deleteReminder, addTransaction, darkMode } = useData();
  const [showForm, setShowForm] = useState(false);
  
  const [newReminder, setNewReminder] = useState({
    title: '',
    amount: '',
    category: 'Utilities',
    dueDate: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminder.title || !newReminder.amount || !newReminder.dueDate) return;

    await addReminder({
      title: newReminder.title,
      amount: Number(newReminder.amount),
      category: newReminder.category,
      dueDate: newReminder.dueDate,
      status: 'pending'
    });

    setNewReminder({ title: '', amount: '', category: 'Utilities', dueDate: '' });
    setShowForm(false);
  };

  const handleMarkPaid = async (reminder: Reminder) => {
    await updateReminder(reminder.id, { status: 'paid' });
    
    // Auto-create a transaction
    await addTransaction({
      title: reminder.title,
      amount: reminder.amount,
      category: reminder.category as any, // assuming valid category
      date: new Date().toISOString().split('T')[0],
      type: 'expense'
    });
  };

  const handleDelete = async (id: string) => {
    await deleteReminder(id);
  };

  // Sort: pending first, then by date. Paid ones at the bottom.
  const sortedReminders = [...(reminders || [])].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-600 dark:from-teal-300 dark:to-emerald-500">
            Bill Reminders
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Never miss a payment again.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-teal-500/25"
        >
          {showForm ? 'Cancel' : <><Plus size={20} /> Add Bill</>}
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl p-6 shadow-xl"
        >
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Add New Reminder</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bill Title</label>
              <input
                type="text"
                placeholder="e.g., Electricity, Rent, Internet"
                value={newReminder.title}
                onChange={e => setNewReminder({ ...newReminder, title: e.target.value })}
                className="w-full px-4 py-2 rounded-xl bg-gray-50/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all dark:text-white dark:[color-scheme:dark]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="number"
                  placeholder="0.00"
                  value={newReminder.amount}
                  onChange={e => setNewReminder({ ...newReminder, amount: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all dark:text-white dark:[color-scheme:dark]"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
              <input
                type="date"
                value={newReminder.dueDate}
                onChange={e => setNewReminder({ ...newReminder, dueDate: e.target.value })}
                className="w-full px-4 py-2 rounded-xl bg-gray-50/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all dark:text-white dark:[color-scheme:dark]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select
                value={newReminder.category}
                onChange={e => setNewReminder({ ...newReminder, category: e.target.value })}
                className="w-full px-4 py-2 rounded-xl bg-gray-50/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all dark:text-white dark:[color-scheme:dark]"
              >
                <option value="Utilities">Utilities</option>
                <option value="Housing">Housing</option>
                <option value="Internet">Internet/Telecom</option>
                <option value="Subscriptions">Subscriptions</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Others">Others</option>
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end mt-2">
              <button
                type="submit"
                className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-xl font-medium transition-colors"
              >
                Save Reminder
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700/50">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <Bell size={20} className="text-teal-500" /> All Reminders
          </h2>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-slate-700/50">
          {sortedReminders.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No bills or reminders added yet.
            </div>
          ) : (
            sortedReminders.map(reminder => {
              const isPaid = reminder.status === 'paid';
              const isOverdue = !isPaid && new Date(reminder.dueDate) < new Date(new Date().setHours(0,0,0,0));
              
              return (
                <div key={reminder.id} className={`p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${isPaid ? 'opacity-60 bg-gray-50/50 dark:bg-slate-900/20' : 'hover:bg-gray-50/80 dark:hover:bg-slate-700/30'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl flex-shrink-0 ${isPaid ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' : isOverdue ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' : 'bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400'}`}>
                      {isPaid ? <Check size={24} /> : isOverdue ? <Bell size={24} /> : <Clock size={24} />}
                    </div>
                    <div>
                      <h3 className={`font-medium ${isPaid ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                        {reminder.title}
                      </h3>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-xs">
                          {reminder.category}
                        </span>
                        <span>Due: {new Date(reminder.dueDate).toLocaleDateString()}</span>
                        {isOverdue && <span className="text-red-500 font-medium text-xs">Overdue!</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                      ₹{reminder.amount.toLocaleString()}
                    </div>
                    <div className="flex gap-2">
                      {!isPaid && (
                        <button
                          onClick={() => handleMarkPaid(reminder)}
                          title="Mark as Paid"
                          className="p-2 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-500/20 rounded-lg transition-colors"
                        >
                          <Check size={20} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(reminder.id)}
                        title="Delete"
                        className="p-2 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
