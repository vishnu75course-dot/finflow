
export type Category = 'Food' | 'Travel' | 'Entertainment' | 'Shopping' | 'Utilities' | 'Salary' | 'Investment' | 'Others';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: Category;
  date: string;
  type: 'income' | 'expense';
}

export interface Budget {
  category: Category;
  limit: number;
  spent: number;
}

export interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  deadline?: string;
  icon?: string;
}

export interface Reminder {
  id: string;
  title: string;
  amount: number;
  category: Category | string;
  dueDate: string;
  status: 'pending' | 'paid';
}

export interface User {
  name: string;
  email: string;
  monthlyIncome: number;
  currency: string;
  avatar?: string;
  profileImage?: string;
}

export interface AIInsight {
  id: string;
  type: 'warning' | 'tip' | 'success';
  message: string;
  category?: Category;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}
