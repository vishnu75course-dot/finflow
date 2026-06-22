
import { Transaction, Budget, Goal, AIInsight, User } from './types';

export const DUMMY_USER: User = {
  name: "Vishnu",
  email: "vishnu@gmail.com",
  monthlyIncome: 50000,
  currency: "₹",
};

export const DUMMY_TRANSACTIONS: Transaction[] = [
  { id: '1', title: 'Swiggy', amount: 250, category: 'Food', date: '2026-04-28', type: 'expense' },
  { id: '2', title: 'Uber', amount: 180, category: 'Travel', date: '2026-04-27', type: 'expense' },
  { id: '3', title: 'Salary', amount: 50000, category: 'Salary', date: '2026-04-01', type: 'income' },
  { id: '4', title: 'Dominos', amount: 300, category: 'Food', date: '2026-04-25', type: 'expense' },
  { id: '5', title: 'Petrol', amount: 1000, category: 'Travel', date: '2026-04-24', type: 'expense' },
  { id: '6', title: 'Netflix', amount: 499, category: 'Entertainment', date: '2026-04-20', type: 'expense' },
  { id: '7', title: 'Amazon Shopping', amount: 3500, category: 'Shopping', date: '2026-04-18', type: 'expense' },
  { id: '8', title: 'Electricity Bill', amount: 1200, category: 'Utilities', date: '2026-04-15', type: 'expense' },
];

export const DUMMY_BUDGETS: Budget[] = [
  { category: 'Food', limit: 5000, spent: 4200 },
  { category: 'Travel', limit: 3000, spent: 2500 },
  { category: 'Shopping', limit: 4000, spent: 4500 },
  { category: 'Entertainment', limit: 2000, spent: 499 },
];

export const DUMMY_GOALS: Goal[] = [
  { id: '1', title: 'Buy Laptop', target: 60000, current: 20000 },
  { id: '2', title: 'Europe Trip', target: 30000, current: 12000 },
];

export const DUMMY_INSIGHTS: AIInsight[] = [
  { id: '1', type: 'warning', message: 'You spent 32% more on food this week.', category: 'Food' },
  { id: '2', type: 'tip', message: 'Weekend spending is 15% higher than average.', category: 'Others' },
  { id: '3', type: 'tip', message: 'Reduce Swiggy orders to save ₹1500/month.', category: 'Food' },
];
