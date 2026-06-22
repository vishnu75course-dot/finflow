
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Download, Calendar, TrendingUp, ArrowUpRight, ArrowDownRight, Filter, Wallet } from 'lucide-react';
import { useData } from '../DataContext';

export default function Reports() {
  const { transactions, loading, user } = useData();
  const currency = user?.currency || '₹';
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const prevMonthDate = new Date();
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    return prevMonthDate.toLocaleString('default', { month: 'short', year: 'numeric' });
  });

  const monthlyHistory = useMemo(() => {
    const months: Record<string, { month: string; income: number; expense: number; rawDate: Date }> = {};
    
    transactions.forEach(tx => {
      const date = new Date(tx.date);
      const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      if (!months[monthYear]) {
        months[monthYear] = { month: monthYear, income: 0, expense: 0, rawDate: new Date(date.getFullYear(), date.getMonth(), 1) };
      }
      
      if (tx.type === 'income') {
        months[monthYear].income += tx.amount;
      } else {
        months[monthYear].expense += tx.amount;
      }
    });

    return Object.values(months)
      .sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
  }, [transactions]);

  const monthOptions = useMemo(() => {
    return monthlyHistory.map(m => m.month).reverse();
  }, [monthlyHistory]);

  const filteredData = useMemo(() => {
    if (selectedMonth === 'all') return monthlyHistory;
    return monthlyHistory.filter(m => m.month === selectedMonth);
  }, [monthlyHistory, selectedMonth]);

  const currentStats = useMemo(() => {
    const totalIncome = filteredData.reduce((sum, m) => sum + m.income, 0);
    const totalExpense = filteredData.reduce((sum, m) => sum + m.expense, 0);
    const savings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

    // MoM Comparison logic
    let prevStats = null;
    if (selectedMonth !== 'all' && monthlyHistory.length > 1) {
      const currentIndex = monthlyHistory.findIndex(m => m.month === selectedMonth);
      if (currentIndex > 0) {
        prevStats = monthlyHistory[currentIndex - 1];
      }
    }
    
    return { 
      totalIncome, 
      totalExpense, 
      savings, 
      savingsRate,
      mom: prevStats ? {
        income: ((totalIncome - prevStats.income) / (prevStats.income || 1)) * 100,
        expense: ((totalExpense - prevStats.expense) / (prevStats.expense || 1)) * 100,
        savings: ((savings - (prevStats.income - prevStats.expense)) / (Math.abs(prevStats.income - prevStats.expense) || 1)) * 100
      } : null
    };
  }, [filteredData, selectedMonth, monthlyHistory]);

  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    const filteredTxs = transactions.filter(tx => {
      if (selectedMonth === 'all') return true;
      const txMonth = new Date(tx.date).toLocaleString('default', { month: 'short', year: 'numeric' });
      return txMonth === selectedMonth;
    });

    filteredTxs.filter(tx => tx.type === 'expense').forEach(tx => {
      categories[tx.category] = (categories[tx.category] || 0) + tx.amount;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [transactions, selectedMonth]);

  const trendData = useMemo(() => {
    let cumulative = 0;
    return monthlyHistory.map(m => {
      cumulative += (m.income - m.expense);
      return {
        month: m.month,
        rate: m.income > 0 ? ((m.income - m.expense) / m.income) * 100 : 0,
        balance: cumulative
      };
    });
  }, [monthlyHistory]);

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const handleExportExcel = () => {
    const headers = ['Month & Year', 'Income', 'Expenses', 'Net Savings', 'Savings Rate (%)'];
    const rows = monthlyHistory.map(data => {
      const savings = data.income - data.expense;
      const rate = data.income > 0 ? (savings / data.income) * 100 : 0;
      return [
        `"${data.month}"`,
        data.income,
        data.expense,
        savings,
        rate.toFixed(2)
      ].join(',');
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "financial_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-2">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Financial Reports</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Detailed analysis of your financial history and performance.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-hidden focus:ring-4 focus:ring-indigo-50 appearance-none min-w-[200px] cursor-pointer shadow-sm shadow-slate-100"
            >
              <option value="all">All History</option>
              {monthOptions.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export Excel</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg border-none relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={64} />
          </div>
          <p className="text-white/80 text-[10px] font-black uppercase tracking-wider mb-2">Savings Rate</p>
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-3xl font-black text-white">{currentStats.savingsRate.toFixed(1)}%</h3>
              <p className="text-xs text-indigo-100 font-medium mt-1">{currency}{currentStats.savings.toLocaleString()} saved</p>
            </div>
            {currentStats.mom && (
               <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md bg-white/10 border border-white/10 ${currentStats.mom.savings >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                 {currentStats.mom.savings >= 0 ? '+' : ''}{currentStats.mom.savings.toFixed(0)}%
               </span>
            )}
          </div>
        </div>
        <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg border-none relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <ArrowUpRight size={64} />
          </div>
          <p className="text-white/80 text-[10px] font-black uppercase tracking-wider mb-2">Total Income</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-black text-white">{currency}{currentStats.totalIncome.toLocaleString()}</h3>
            {currentStats.mom && (
               <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md bg-white/10 border border-white/10 ${currentStats.mom.income >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                 {currentStats.mom.income >= 0 ? '+' : ''}{currentStats.mom.income.toFixed(0)}%
               </span>
            )}
          </div>
        </div>
        <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg border-none relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <ArrowDownRight size={64} />
          </div>
          <p className="text-white/80 text-[10px] font-black uppercase tracking-wider mb-2">Total Expenses</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-black text-white">{currency}{currentStats.totalExpense.toLocaleString()}</h3>
            {currentStats.mom && (
               <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md bg-white/10 border border-white/10 ${currentStats.mom.expense <= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                 {currentStats.mom.expense >= 0 ? '+' : ''}{currentStats.mom.expense.toFixed(0)}%
               </span>
            )}
          </div>
        </div>
        <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg border-none relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet size={64} />
          </div>
          <p className="text-white/80 text-[10px] font-black uppercase tracking-wider mb-2">Net Savings</p>
          <div className="flex items-end justify-between">
            <h3 className={`text-3xl font-black text-white`}>
              {currency}{currentStats.savings.toLocaleString()}
            </h3>
            <Wallet size={24} className="text-white/30 mb-1" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Income vs Expenses</h3>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Calendar size={14} />
              <span>{selectedMonth === 'all' ? 'All Time' : selectedMonth}</span>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#F1F5F9'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#F43F5E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Savings Rate Trend (%)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  name="Savings Rate" 
                  stroke="#4F46E5" 
                  strokeWidth={3} 
                  dot={{ fill: '#4F46E5', strokeWidth: 2, r: 4 }} 
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Expense Distribution</h3>
          <div className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Cumulative Balance Growth</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value: number) => `${currency}${value.toLocaleString()}`}
                />
                <Area type="monotone" dataKey="balance" name="Total Balance" stroke="#10B981" fillOpacity={1} fill="url(#colorBalance)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden border-none shadow-xl shadow-slate-200">
        <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Historical Ledger</h3>
          <div className="px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-lg">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{monthlyHistory.length} Months Logged</span>
          </div>
        </div>
        <div className="overflow-x-auto bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Month & Year</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Income</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Expenses</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Net Savings</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Savings Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...monthlyHistory].reverse().map((data) => {
                const savings = data.income - data.expense;
                const rate = data.income > 0 ? (savings / data.income) * 100 : 0;
                return (
                  <tr key={data.month} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-tight group-hover:text-brand-accent transition-colors">{data.month}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs font-bold text-emerald-600 tabular-nums">{currency}{data.income.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs font-bold text-rose-500 tabular-nums">{currency}{data.expense.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-xs font-black tabular-nums ${savings >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                        {currency}{savings.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-[120px] h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${rate >= 20 ? 'bg-indigo-600' : 'bg-rose-500'}`} 
                            style={{ width: `${Math.max(0, Math.min(100, rate))}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 tabular-nums">{rate.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {monthlyHistory.length === 0 && (
            <div className="p-16 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                <Calendar size={24} />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No historical node data detected</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
