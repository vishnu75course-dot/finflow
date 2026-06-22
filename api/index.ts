import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "../routes/auth.js";
import dataRoutes from "../routes/data.js";
import supabase from "../config/supabaseClient.js";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Static API route mappings
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/data', dataRoutes);

// AI chat endpoint
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Authorization required" });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const [txRes, bgRes, goalsRes] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('budgets').select('*').eq('user_id', user.id),
      supabase.from('goals').select('*').eq('user_id', user.id)
    ]);

    const transactions = txRes.data || [];
    const budgets = bgRes.data || [];
    const goals = goalsRes.data || [];

    const expensesByCategory = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc: Record<string, number>, t: any) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>);

    const totalExpenses = Object.values(expensesByCategory).reduce((a: number, b: number) => a + b, 0);
    const topCategory = (Object.entries(expensesByCategory) as [string, number][]).sort((a, b) => b[1] - a[1])[0];

    const summary = `
User: ${user.user_metadata?.name || user.email}
Monthly Income: ${user.user_metadata?.monthly_income || 0} ${user.user_metadata?.currency || '₹'}
Total Expenses (recent): ${totalExpenses}
Top Spending Category: ${topCategory?.[0]} (${topCategory?.[1]})
All Categories: ${JSON.stringify(expensesByCategory)}
Budgets: ${JSON.stringify(budgets)}
Goals: ${JSON.stringify(goals)}
Recent Transactions: ${JSON.stringify(transactions.slice(0, 10))}
    `.trim();

    const systemPrompt = `You are FinFlow Oracle, a professional AI financial advisor. 
    You have access to the user's financial data. Answer concisely and professionally.
    Use currency symbols (₹) and reference specific numbers from their data.
    
    User Financial Data:
    ${summary}`;

    const messages = [
      ...history.map((m: any) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
      { role: "user", content: message }
    ];

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.create({
      model: "gpt-5.4-mini",
      input: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      store: true
    });

    res.json({ reply: response.output_text || "" });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: "Chat service error", details: error.message, stack: error.stack });
  }
});

// AI insights endpoint
app.post("/api/ai/insights", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Authorization required" });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const [txRes, bgRes] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('budgets').select('*').eq('user_id', user.id)
    ]);

    const transactions = txRes.data || [];
    const budgets = bgRes.data || [];

    const systemPrompt = `Generate 3 short, actionable financial insights as JSON array: 
    [{"type": "tip" | "warning", "message": "string", "category": "string"}]
    Use the user's actual transaction data. Be specific with numbers.`;

    const messages = [
      { role: "user", content: `Transactions: ${JSON.stringify(transactions.slice(0, 20))}\nBudgets: ${JSON.stringify(budgets)}` }
    ];

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.create({
      model: "gpt-5.4-mini",
      input: [
        { role: "system", content: systemPrompt },
        ...messages
      ] as any[],
      store: true
    });

    const reply = response.output_text || "";
    
    let insights: any[] = [];
    try {
      const parsed = JSON.parse(reply.trim());
      if (Array.isArray(parsed)) {
        insights = parsed;
      } else if (parsed && Array.isArray(parsed.insights)) {
        insights = parsed.insights;
      }
    } catch {
      const arrayMatch = reply.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        try {
          const parsed = JSON.parse(arrayMatch[0]);
          if (Array.isArray(parsed)) insights = parsed;
        } catch {
          // ignore
        }
      }
    }
    res.json(insights);
  } catch (error: any) {
    console.error('Insights error:', error);
    res.status(500).json({ error: "Insights service error", details: error.message, stack: error.stack });
  }
});

export default app;
