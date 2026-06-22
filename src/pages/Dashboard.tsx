
import React, { useMemo, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Line, ComposedChart
} from 'recharts';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  CreditCard, 
  TrendingUp,
  Plus,
  ArrowRight
} from 'lucide-react';
import { useData } from '../DataContext';
import { useNavigate } from 'react-router-dom';
import { Calendar } from '../components/Calendar';

export default function Dashboard() {
  const { transactions, budgets, goals, insights, notifications, reminders, loading, user } = useData();
  const currency = user?.currency || '₹';
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '1y'>('7d');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const navigate = useNavigate();

  const highlightDates = useMemo(() => {
    return transactions.map(tx => new Date(tx.date));
  }, [transactions]);

  const reminderDates = useMemo(() => {
    return (reminders || []).filter(r => r.status === 'pending').map(r => new Date(r.dueDate));
  }, [reminders]);

  const stats = useMemo(() => {
    // Baseline Period Stats (Current Month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyTransactions = transactions.filter(tx => {
      const d = new Date(tx.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const monthlyIncomeActual = monthlyTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
    const monthlyExpenseActual = monthlyTransactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
    const monthlyBalance = monthlyIncomeActual - monthlyExpenseActual;
    
    // Use the user's fixed monthly income as the denominator for consistency (Optimization)
    const baselineIncome = user?.monthlyIncome || monthlyIncomeActual || 50000;
    const monthlySavingsRate = baselineIncome > 0 ? ((baselineIncome - monthlyExpenseActual) / baselineIncome) * 100 : 0;

    // 3. Selective Context (Daily/Filtered)
    const dataToView = selectedDate 
      ? transactions.filter(tx => new Date(tx.date).toDateString() === selectedDate.toDateString()) 
      : monthlyTransactions;
    
    const viewIncome = dataToView.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
    const viewExpense = dataToView.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
    
    // Group expenses by category for the view
    const categoryMap: Record<string, number> = {};
    dataToView
      .filter(tx => tx.type === 'expense')
      .forEach(tx => {
        categoryMap[tx.category] = (categoryMap[tx.category] || 0) + tx.amount;
      });
    
    const categoryData = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return { 
      income: viewIncome, 
      expense: viewExpense, 
      balance: monthlyBalance, 
      savingsRate: monthlySavingsRate, 
      categoryData,
      monthlyIncomeActual,
      monthlyExpenseActual,
      baselineIncome,
      monthlyTransactions
    };
  }, [transactions, selectedDate, user]);

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const getWeekOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const pastDaysOfMonth = (date.getDate() + firstDay.getDay() - 1);
    return Math.ceil((pastDaysOfMonth + 1) / 7);
  };

  const currentWeek = useMemo(() => getWeekOfMonth(new Date()), []);

  // Shared aggregation helper to compute income, expense, efficiency from a transaction list
  const aggregateTxs = (txList: typeof transactions) => {
    const income = txList.filter(tx => tx.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = txList.filter(tx => tx.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const efficiency = income > 0 ? Math.max(0, Math.min(100, ((income - expense) / income) * 100)) : 0;
    return { income, expense, efficiency };
  };

  const dynamicChartData = useMemo(() => {
    const now = new Date();

    // Single date view: show exact totals for the selected day
    if (selectedDate) {
      const label = selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const dayTxs = transactions.filter(tx =>
        new Date(tx.date).toDateString() === selectedDate.toDateString()
      );
      return [{ name: label, ...aggregateTxs(dayTxs) }];
    }

    // Last 7 Days: one point per day of the current week (Sun–Sat)
    if (timeframe === '7d') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        const label = d.toLocaleDateString('en-US', { weekday: 'short' });
        const dayTxs = transactions.filter(tx =>
          new Date(tx.date).toDateString() === d.toDateString()
        );
        return { name: label, ...aggregateTxs(dayTxs) };
      });
    }

    // Last 30 Days: 4 calendar weeks of the current month (Week 1 = 1st–7th, etc.)
    if (timeframe === '30d') {
      const year = now.getFullYear();
      const month = now.getMonth();
      const weekRanges = [
        { start: 1,  end: 7  },
        { start: 8,  end: 14 },
        { start: 15, end: 21 },
        { start: 22, end: 31 }, // covers remaining days (28/29/30/31)
      ];

      return weekRanges.map(({ start, end }, i) => {
        const startDate = new Date(year, month, start, 0, 0, 0, 0);
        const endDate   = new Date(year, month, end, 23, 59, 59, 999);

        const periodTxs = transactions.filter(tx => {
          const d = new Date(tx.date);
          return d >= startDate && d <= endDate;
        });
        return { name: `Week ${i + 1}`, ...aggregateTxs(periodTxs) };
      });
    }

    // Overall 1 Year: one point per calendar month (Jan–Dec) of the current year
    return Array.from({ length: 12 }).map((_, i) => {
      const d = new Date(now.getFullYear(), i, 1);
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      const monthTxs = transactions.filter(tx => {
        const tDate = new Date(tx.date);
        return tDate.getMonth() === i && tDate.getFullYear() === now.getFullYear();
      });
      return { name: label, ...aggregateTxs(monthTxs) };
    });
  }, [timeframe, selectedDate, transactions]);

  const activeChartData = dynamicChartData;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-brand-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notifications.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {notifications.slice(0, 2).map(notif => (
            <div key={notif.id} className={cn(
              "p-4 rounded-2xl flex items-center gap-4 border-l-4 shadow-sm",
              notif.type === 'alert' ? "bg-rose-50 border-rose-500 text-rose-900" : "bg-amber-50 border-amber-500 text-amber-900"
            )}>
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                notif.type === 'alert' ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
              )}>
                <ArrowDownRight size={20} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">{notif.title}</p>
                <p className="text-sm font-bold opacity-90">{notif.message}</p>
              </div>
              <button 
                onClick={() => navigate('/budgets')}
                className="px-3 py-1.5 bg-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm hover:scale-105 transition-transform"
              >
                Resolve
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-indigo-600 text-white rounded-2xl shadow-lg border-none">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Wallet size={20} />
            </div>
            <span className="text-emerald-300 text-xs font-black bg-white/10 px-2 py-1 rounded-lg border border-white/10">
              Current Month
            </span>
          </div>
          <p className="text-indigo-100 text-xs font-black uppercase tracking-widest mb-1">Monthly Balance</p>
          <h3 className="text-3xl font-black mt-1">{currency}{stats.balance.toLocaleString()}</h3>
        </div>

        <div className="p-6 bg-indigo-600 text-white rounded-2xl shadow-lg border-none">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ArrowUpRight size={20} />
            </div>
            <span className="text-white/80 text-[10px] font-black uppercase tracking-widest">
              {selectedDate ? 'Daily' : 'Baseline'}
            </span>
          </div>
          <p className="text-indigo-100 text-xs font-black uppercase tracking-widest mb-1">
            {selectedDate ? 'Date Income' : 'Expected Income'}
          </p>
          <h3 className="text-3xl font-black mt-1">
            {currency}{(selectedDate ? stats.income : stats.baselineIncome).toLocaleString()}
          </h3>
        </div>

        <div className="p-6 bg-indigo-600 text-white rounded-2xl shadow-lg border-none">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ArrowDownRight size={20} />
            </div>
            <span className="text-white/80 text-[10px] font-black uppercase tracking-widest">
              {selectedDate ? 'Daily' : 'Monthly'}
            </span>
          </div>
          <p className="text-indigo-100 text-xs font-black uppercase tracking-widest mb-1">
            {selectedDate ? 'Date Expense' : 'Total Spent'}
          </p>
          <h3 className="text-3xl font-black mt-1">{currency}{stats.expense.toLocaleString()}</h3>
        </div>

        <div className="p-6 bg-indigo-600 text-white rounded-2xl shadow-lg border-none">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <span className="text-white/80 text-[10px] font-black uppercase tracking-widest">M-O-M Reliability</span>
          </div>
          <p className="text-indigo-100 text-xs font-black uppercase tracking-widest mb-1">Efficiency Ratio</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-black text-white">{stats.savingsRate.toFixed(1)}%</h3>
            <span className="text-indigo-200 text-xs font-bold leading-none">Net Savings</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold">Cash Flow</h3>
              {timeframe === '7d' && !selectedDate && (
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-0.5">
                  Current: Week {currentWeek}
                </p>
              )}
            </div>
            <select 
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as '7d' | '30d' | '1y')}
              className="bg-slate-50 border-none rounded-lg text-xs font-bold py-2 pl-3 pr-8 focus:ring-2 focus:ring-brand-accent/20 outline-hidden cursor-pointer"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="1y">Overall 1 Year</option>
            </select>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeChartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Area type="monotone" dataKey="income" stroke="#4F46E5" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} />
                <Area type="monotone" dataKey="expense" stroke="#F43F5E" fillOpacity={0} strokeWidth={3} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Transaction Calendar</h3>
            {selectedDate && (
              <button 
                onClick={() => setSelectedDate(null)}
                className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors"
              >
                Clear Filter
              </button>
            )}
          </div>
          <Calendar 
            highlightDates={highlightDates} 
            reminderDates={reminderDates}
            onDateSelect={(date) => setSelectedDate(date)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold mb-6">Budget Progress</h3>
          <div className="space-y-6">
            {budgets.slice(0, 4).map((budget) => {
              const percent = (budget.spent / budget.limit) * 100;
              return (
                <div key={budget.category}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-700">{budget.category}</span>
                    <span className="font-bold">{currency}{budget.spent.toLocaleString()} / {currency}{budget.limit.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        percent > 90 ? "bg-rose-500" : "bg-indigo-600"
                      )}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <button 
            onClick={() => navigate('/budgets')}
            className="w-full mt-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
            Manage All Budgets <ArrowRight size={16} />
          </button>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-bold mb-6">Expense Distribution</h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="h-[250px] w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    formatter={(value: number) => `${currency}${value.toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 space-y-3">
              {stats.categoryData.slice(0, 5).map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-xs font-medium text-slate-600">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">{currency}{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold mb-6">Savings Efficiency ({timeframe === '7d' ? 'Weekly' : timeframe === '30d' ? 'Monthly' : 'Annual'})</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={activeChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 10}} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 10}} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#4F46E5', fontSize: 10}} domain={[0, 100]} unit="%" />
                <Tooltip 
                  cursor={{fill: '#F1F5F9'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar yAxisId="left" dataKey="income" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar yAxisId="left" dataKey="expense" fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={20} />
                <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-600" />
              <span className="text-[10px] font-black uppercase text-slate-400">Total Income</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-[10px] font-black uppercase text-slate-400">Total Spending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-emerald-500" />
              <span className="text-[10px] font-black uppercase text-slate-400">Efficiency Ratio</span>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between font-bold">
            <div>
              <h3>Recent Account Activity</h3>
              {selectedDate && (
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-0.5">
                  Filtered: {selectedDate.toLocaleDateString()}
                </p>
              )}
            </div>
            <button onClick={() => navigate('/transactions')} className="text-indigo-600 text-sm hover:underline">View All</button>
          </div>
          <div className="divide-y divide-slate-100">
            {(selectedDate 
              ? transactions.filter(tx => new Date(tx.date).toDateString() === selectedDate.toDateString())
              : stats.monthlyTransactions
            )
              .slice(0, 5)
              .map((tx) => (
              <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    tx.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
                  )}>
                    {tx.type === 'income' ? <ArrowUpRight size={18} /> : <CreditCard size={18} />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{tx.title}</p>
                    <p className="text-xs text-slate-500">{tx.category} • {new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "font-bold",
                    tx.type === 'income' ? "text-emerald-600" : "text-slate-900"
                  )}>
                    {tx.type === 'income' ? '+' : '-'}{currency}{tx.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-bold mb-6">Financial Milestones</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const percent = (goal.current / goal.target) * 100;
            return (
              <div key={goal.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-500/30 transition-all group">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
                  {goal.title.toLowerCase().includes('laptop') ? '💻' : '✈️'}
                </div>
                <h4 className="font-bold text-slate-900">{goal.title}</h4>
                <p className="text-xs text-slate-500 mb-4">{currency}{goal.current.toLocaleString()} of {currency}{goal.target.toLocaleString()}</p>
                <div className="h-2 bg-white rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-indigo-600 rounded-full" 
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{Math.round(percent)}% Status</p>
              </div>
            );
          })}
          <button 
            onClick={() => navigate('/goals?action=new')}
            className="p-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-indigo-600 hover:bg-white transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
              <Plus size={24} />
            </div>
            <span className="text-sm font-bold text-slate-500 group-hover:text-slate-900 text-center">Create New Goal</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

