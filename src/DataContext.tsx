import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Transaction, Budget, Goal, Reminder, AIInsight, User, ChatMessage } from './types';
import {
  DUMMY_TRANSACTIONS,
  DUMMY_BUDGETS,
  DUMMY_GOALS,
  DUMMY_INSIGHTS,
  DUMMY_USER,
} from './constants';

// ── Notification type used by Dashboard & Navbar ──
interface Notification {
  id: string;
  type: 'alert' | 'warning';
  title: string;
  message: string;
  category: string;
}

// ── Full context shape (union of everything every component destructures) ──
interface DataContextType {
  // Auth
  isAuthenticated: boolean;
  loading: boolean;
  login: (userData: any, token: string) => void;
  logout: () => void;
  token: string | null;

  // User
  user: User | null;
  updateUser: (partial: Partial<User>) => void;

  // Data collections
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  insights: AIInsight[];
  reminders: Reminder[];
  notifications: Notification[];

  // CRUD helpers
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, data: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  updateBudget: (budget: { category: string; limit: number }) => Promise<void>;
  deleteBudget: (category: string) => Promise<void>;

  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
  updateGoal: (id: string, partial: Partial<Goal>) => Promise<void>;

  addReminder: (reminder: Omit<Reminder, 'id'>) => Promise<void>;
  updateReminder: (id: string, partial: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;

  // Chat history
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;

  // Theme
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// ── Provider ──
export function DataProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  // Auth state
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ff_token'));
  const [user, setUser] = useState<User | null>(() => loadFromStorage('ff_user', null));
  const isAuthenticated = !!token;

  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'ai', text: "Hello! I'm your FinFlow AI assistant. I've analyzed your recent spending patterns. How can I help you optimize your finances today?" }
  ]);

  // Theme
  const [darkMode, setDarkModeState] = useState(() =>
    loadFromStorage('ff_darkMode', false)
  );

  // Apply dark mode class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('ff_darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Persist helpers for mock sessions
  useEffect(() => {
    if (token?.startsWith('mock-jwt-')) {
      localStorage.setItem('ff_transactions', JSON.stringify(transactions));
    }
  }, [transactions, token]);

  useEffect(() => {
    if (token?.startsWith('mock-jwt-')) {
      localStorage.setItem('ff_budgets', JSON.stringify(budgets));
    }
  }, [budgets, token]);

  useEffect(() => {
    if (token?.startsWith('mock-jwt-')) {
      localStorage.setItem('ff_goals', JSON.stringify(goals));
    }
  }, [goals, token]);

  useEffect(() => {
    if (token?.startsWith('mock-jwt-')) {
      localStorage.setItem('ff_reminders', JSON.stringify(reminders));
    }
  }, [reminders, token]);

  // Auth logic: login / logout
  const login = useCallback((userData: any, accessToken: string) => {
    const u: User = {
      name: userData.name || userData.email?.split('@')[0] || 'User',
      email: userData.email || '',
      monthlyIncome: userData.monthlyIncome || DUMMY_USER.monthlyIncome,
      currency: userData.currency || DUMMY_USER.currency,
      profileImage: userData.profileImage,
    };
    setUser(u);
    setToken(accessToken);
    localStorage.setItem('ff_token', accessToken);
    localStorage.setItem('ff_user', JSON.stringify(u));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setTransactions([]);
    setBudgets([]);
    setGoals([]);
    setReminders([]);
    setInsights([]);
    setChatMessages([
      { role: 'ai', text: "Hello! I'm your FinFlow AI assistant. I've analyzed your recent spending patterns. How can I help you optimize your finances today?" }
    ]);
    localStorage.removeItem('ff_token');
    localStorage.removeItem('ff_user');
  }, []);

  // Reusable API Fetch Helper with Authorization headers and Auto-Logout on 401
  const apiFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const currentToken = token || localStorage.getItem('ff_token');
    if (!currentToken) throw new Error("Authentication required");

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${currentToken}`,
      ...options.headers,
    };

    const res = await fetch(url, { ...options, headers });
    
    if (res.status === 401) {
      logout();
      throw new Error("Unauthorized session. Logging out.");
    }
    
    return res;
  }, [token, logout]);

  // Fetch all database records when authenticated token changes
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Handle simulated mock logins (Google / Phone)
    if (token.startsWith('mock-jwt-')) {
      setTransactions(loadFromStorage('ff_transactions', DUMMY_TRANSACTIONS));
      setBudgets(loadFromStorage('ff_budgets', DUMMY_BUDGETS));
      setGoals(loadFromStorage('ff_goals', DUMMY_GOALS));
      setReminders(loadFromStorage('ff_reminders', []));
      setInsights(DUMMY_INSIGHTS);
      setLoading(false);
      return;
    }

    async function fetchAllData() {
      try {
        setLoading(true);
        
        // 1. Fetch user profile settings
        const profileRes = await apiFetch('/api/data/profile');
        const profileJson = await profileRes.json();
        if (isMounted && profileJson.status === 'success') {
          const p = profileJson.data;
          setUser(prev => {
            const updated = {
              name: p.name || prev?.name || 'User',
              email: p.email || prev?.email || '',
              monthlyIncome: p.monthlyIncome || DUMMY_USER.monthlyIncome,
              currency: p.currency || DUMMY_USER.currency,
              profileImage: prev?.profileImage
            };
            localStorage.setItem('ff_user', JSON.stringify(updated));
            return updated;
          });
        }

        // 2. Fetch transactions
        const txRes = await apiFetch('/api/data/transactions');
        const txJson = await txRes.json();
        if (isMounted && txJson.status === 'success') {
          setTransactions(txJson.data || []);
        }

        // 3. Fetch budgets
        const bgRes = await apiFetch('/api/data/budgets');
        const bgJson = await bgRes.json();
        if (isMounted && bgJson.status === 'success') {
          setBudgets(bgJson.data || []);
        }

        // 4. Fetch goals
        const goalsRes = await apiFetch('/api/data/goals');
        const goalsJson = await goalsRes.json();
        if (isMounted && goalsJson.status === 'success') {
          setGoals(goalsJson.data || []);
        }

        // 5. Fetch reminders
        const remRes = await apiFetch('/api/data/reminders');
        const remJson = await remRes.json();
        if (isMounted && remJson.status === 'success') {
          setReminders(remJson.data || []);
        }

        // 6. Fetch insights
        const insightsRes = await apiFetch('/api/data/insights');
        const insightsJson = await insightsRes.json();
        if (isMounted && insightsJson.status === 'success') {
          setInsights(insightsJson.data || []);
        }

      } catch (err) {
        console.error("Error fetching data from database:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchAllData();

    return () => {
      isMounted = false;
    };
  }, [token, apiFetch]);

  // Update profile handler
  const updateUser = useCallback(async (partial: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      localStorage.setItem('ff_user', JSON.stringify(updated));
      return updated;
    });

    const isMock = token?.startsWith('mock-jwt-');
    if (isMock) return;

    if (token) {
      try {
        await apiFetch('/api/data/profile', {
          method: 'PUT',
          body: JSON.stringify(partial)
        });
      } catch (err) {
        console.error("Failed to persist user profile settings:", err);
      }
    }
  }, [token, apiFetch]);

  // ── Transactions CRUD ──
  const addTransaction = useCallback(async (tx: Omit<Transaction, 'id'>) => {
    const isMock = token?.startsWith('mock-jwt-');
    if (isMock) {
      const newTx: Transaction = { ...tx, id: generateId() };
      setTransactions(prev => [newTx, ...prev]);

      if (tx.type === 'expense') {
        setBudgets(prev =>
          prev.map(b =>
            b.category === tx.category ? { ...b, spent: b.spent + tx.amount } : b
          )
        );
      }
      return;
    }

    try {
      const res = await apiFetch('/api/data/transactions', {
        method: 'POST',
        body: JSON.stringify(tx)
      });
      const json = await res.json();
      if (json.status === 'success') {
        const newTx = json.data;
        setTransactions(prev => [newTx, ...prev]);

        // Trigger budget spent sync from backend to ensure alignment
        const bgRes = await apiFetch('/api/data/budgets');
        const bgJson = await bgRes.json();
        if (bgJson.status === 'success') {
          setBudgets(bgJson.data);
        }
      }
    } catch (err) {
      console.error("Failed to add transaction:", err);
    }
  }, [apiFetch, token]);

  const updateTransaction = useCallback(async (id: string, data: Omit<Transaction, 'id'>) => {
    const isMock = token?.startsWith('mock-jwt-');
    if (isMock) {
      setTransactions(prev => prev.map(t => (t.id === id ? { ...data, id } : t)));
      return;
    }

    try {
      const res = await apiFetch(`/api/data/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (json.status === 'success') {
        setTransactions(prev => prev.map(t => (t.id === id ? { ...json.data } : t)));

        // Sync budgets spent dynamically
        const bgRes = await apiFetch('/api/data/budgets');
        const bgJson = await bgRes.json();
        if (bgJson.status === 'success') {
          setBudgets(bgJson.data);
        }
      }
    } catch (err) {
      console.error("Failed to update transaction:", err);
    }
  }, [apiFetch, token]);

  const deleteTransaction = useCallback(async (id: string) => {
    const isMock = token?.startsWith('mock-jwt-');
    if (isMock) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      return;
    }

    try {
      const res = await apiFetch(`/api/data/transactions/${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.status === 'success') {
        setTransactions(prev => prev.filter(t => t.id !== id));

        // Sync budgets spent dynamically
        const bgRes = await apiFetch('/api/data/budgets');
        const bgJson = await bgRes.json();
        if (bgJson.status === 'success') {
          setBudgets(bgJson.data);
        }
      }
    } catch (err) {
      console.error("Failed to delete transaction:", err);
    }
  }, [apiFetch, token]);

  // ── Budgets CRUD ──
  const updateBudget = useCallback(async (budget: { category: string; limit: number }) => {
    const isMock = token?.startsWith('mock-jwt-');
    if (isMock) {
      setBudgets(prev => {
        const exists = prev.find(b => b.category === budget.category);
        if (exists) {
          return prev.map(b => (b.category === budget.category ? { ...b, limit: budget.limit } : b));
        }
        return [...prev, { category: budget.category as any, limit: budget.limit, spent: 0 }];
      });
      return;
    }

    try {
      const res = await apiFetch('/api/data/budgets', {
        method: 'POST',
        body: JSON.stringify(budget)
      });
      const json = await res.json();
      if (json.status === 'success') {
        const savedBudget = json.data;
        setBudgets(prev => {
          const exists = prev.find(b => b.category === savedBudget.category);
          if (exists) {
            return prev.map(b => (b.category === savedBudget.category ? savedBudget : b));
          }
          return [...prev, savedBudget];
        });
      } else {
        throw new Error(json.message || 'Failed to save budget');
      }
    } catch (err) {
      console.error("Failed to save budget:", err);
      alert("Failed to save budget: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  }, [apiFetch, token]);

  const deleteBudget = useCallback(async (category: string) => {
    const isMock = token?.startsWith('mock-jwt-');
    if (isMock) {
      setBudgets(prev => prev.filter(b => b.category !== category));
      return;
    }

    try {
      const res = await apiFetch(`/api/data/budgets/${category}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.status === 'success') {
        setBudgets(prev => prev.filter(b => b.category !== category));
      }
    } catch (err) {
      console.error("Failed to delete budget:", err);
    }
  }, [apiFetch, token]);

  // ── Goals CRUD ──
  const addGoal = useCallback(async (goal: Omit<Goal, 'id'>) => {
    const isMock = token?.startsWith('mock-jwt-');
    if (isMock) {
      setGoals(prev => [...prev, { ...goal, id: generateId() }]);
      return;
    }

    try {
      const res = await apiFetch('/api/data/goals', {
        method: 'POST',
        body: JSON.stringify(goal)
      });
      const json = await res.json();
      if (json.status === 'success') {
        setGoals(prev => [...prev, json.data]);
      } else {
        throw new Error(json.message || 'Failed to create goal');
      }
    } catch (err) {
      console.error("Failed to create goal:", err);
      alert("Failed to create goal: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  }, [apiFetch, token]);

  const updateGoal = useCallback(async (id: string, partial: Partial<Goal>) => {
    const isMock = token?.startsWith('mock-jwt-');
    if (isMock) {
      setGoals(prev => prev.map(g => (g.id === id ? { ...g, ...partial } : g)));
      return;
    }

    try {
      const res = await apiFetch(`/api/data/goals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(partial)
      });
      const json = await res.json();
      if (json.status === 'success') {
        setGoals(prev => prev.map(g => (g.id === id ? { ...g, ...json.data } : g)));
      }
    } catch (err) {
      console.error("Failed to update goal:", err);
    }
  }, [apiFetch, token]);

  // ── Reminders CRUD ──
  const addReminder = useCallback(async (reminder: Omit<Reminder, 'id'>) => {
    const isMock = token?.startsWith('mock-jwt-');
    if (isMock) {
      setReminders(prev => [...prev, { ...reminder, id: generateId() }]);
      return;
    }

    try {
      const res = await apiFetch('/api/data/reminders', {
        method: 'POST',
        body: JSON.stringify(reminder)
      });
      const json = await res.json();
      if (json.status === 'success') {
        setReminders(prev => [...prev, json.data]);
      } else {
        throw new Error(json.message || 'Failed to save reminder');
      }
    } catch (err) {
      console.error("Failed to save reminder:", err);
      alert("Failed to save reminder: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  }, [apiFetch, token]);

  const updateReminder = useCallback(async (id: string, partial: Partial<Reminder>) => {
    const isMock = token?.startsWith('mock-jwt-');
    if (isMock) {
      setReminders(prev => prev.map(r => (r.id === id ? { ...r, ...partial } : r)));
      return;
    }

    try {
      const res = await apiFetch(`/api/data/reminders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(partial)
      });
      const json = await res.json();
      if (json.status === 'success') {
        setReminders(prev => prev.map(r => (r.id === id ? { ...r, ...json.data } : r)));
      }
    } catch (err) {
      console.error("Failed to update reminder:", err);
    }
  }, [apiFetch, token]);

  const deleteReminder = useCallback(async (id: string) => {
    const isMock = token?.startsWith('mock-jwt-');
    if (isMock) {
      setReminders(prev => prev.filter(r => r.id !== id));
      return;
    }

    try {
      const res = await apiFetch(`/api/data/reminders/${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.status === 'success') {
        setReminders(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete reminder:", err);
    }
  }, [apiFetch, token]);

  // Theme state setter
  const setDarkMode = useCallback((value: boolean) => {
    setDarkModeState(value);
  }, []);

  // ── Computed notifications (budget overruns) ──
  const notifications = useMemo<Notification[]>(() => {
    return budgets
      .filter(b => b.spent >= b.limit * 0.85)
      .map(b => ({
        id: `notif-${b.category}`,
        type: (b.spent >= b.limit ? 'alert' : 'warning') as 'alert' | 'warning',
        title: b.spent >= b.limit ? 'Budget Breached' : 'Budget Warning',
        message: b.spent >= b.limit
          ? `${b.category} spending exceeded the ₹${b.limit.toLocaleString()} limit.`
          : `${b.category} spending is at ${Math.round((b.spent / b.limit) * 100)}% of your limit.`,
        category: b.category,
      }));
  }, [budgets]);

  const value = useMemo<DataContextType>(
    () => ({
      isAuthenticated,
      loading,
      login,
      logout,
      token,
      user,
      updateUser,
      transactions,
      budgets,
      goals,
      insights,
      reminders,
      notifications,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      updateBudget,
      deleteBudget,
      addGoal,
      updateGoal,
      addReminder,
      updateReminder,
      deleteReminder,
      chatMessages,
      setChatMessages,
      darkMode,
      setDarkMode,
    }),
    [
      isAuthenticated, loading, login, logout, token, user, updateUser,
      transactions, budgets, goals, insights, reminders, notifications,
      addTransaction, updateTransaction, deleteTransaction,
      updateBudget, deleteBudget,
      addGoal, updateGoal,
      addReminder, updateReminder, deleteReminder,
      chatMessages, setChatMessages,
      darkMode, setDarkMode,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// ── Hook ──
export function useData(): DataContextType {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
