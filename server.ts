import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from "./routes/auth.js";
import dataRoutes from "./routes/data.js";
import supabase from "./config/supabaseClient.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function callAI(messages: any[], systemPrompt: string) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured. Please add it to your .env file.");
  }

  try {
    const inputMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];
    const response = await openai.responses.create({
      model: "gpt-5.4-mini",
      input: inputMessages,
      store: true
    });
    return response.output_text || "";
  } catch (error: any) {
    console.error('OpenAI error:', error?.status || error?.response?.status, error?.message);
    throw error;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/data', dataRoutes);

  // --- AI CHAT ENDPOINT (fetches user data from Supabase) ---
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      const authHeader = req.headers.authorization;
      
      console.log('Chat request:', { message, hasAuth: !!authHeader });
      
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Authorization required" });
      }
      
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      console.log('Auth result:', { user: user?.id, authError: authError?.message });
      
      if (authError || !user) {
        return res.status(401).json({ error: "Invalid token" });
      }

      // Fetch user's financial data from Supabase
      const [txRes, bgRes, goalsRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('budgets').select('*').eq('user_id', user.id),
        supabase.from('goals').select('*').eq('user_id', user.id)
      ]);

      console.log('DB results:', { 
        txError: txRes.error?.message, 
        txCount: txRes.data?.length,
        bgError: bgRes.error?.message,
        goalsError: goalsRes.error?.message 
      });

      const transactions = txRes.data || [];
      const budgets = bgRes.data || [];
      const goals = goalsRes.data || [];

      // Build financial summary for GPT
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

      const reply = await callAI(messages, systemPrompt);
      res.json({ reply: reply || "I couldn't generate a response." });
    } catch (error: any) {
      console.error('Chat error:', error);
      console.error('Error message:', error.message);
      console.error('Error status:', error.status);
      console.error('Error code:', error.code);
      res.status(500).json({ error: "Chat service error", details: error.message, status: error.status });
    }
  });

  // --- AI INSIGHTS ENDPOINT ---
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

      // Fetch user's financial data
      const [txRes, bgRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('budgets').select('*').eq('user_id', user.id)
      ]);

      const transactions = txRes.data || [];
      const budgets = bgRes.data || [];

      const expensesByCategory = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
          return acc;
        }, {} as Record<string, number>);

      const systemPrompt = `Generate 3 short, actionable financial insights as JSON array: 
      [{"type": "tip" | "warning", "message": "string", "category": "string"}]
      Use the user's actual transaction data. Be specific with numbers.`;

      const messages = [
        { role: "user", content: `Transactions: ${JSON.stringify(transactions.slice(0, 20))}\nBudgets: ${JSON.stringify(budgets)}` }
      ];

      const reply = await callAI(messages, systemPrompt);
      
      let insights: any[] = [];
      try {
        // Try direct parse first (AI should return a JSON array)
        const parsed = JSON.parse(reply.trim());
        if (Array.isArray(parsed)) {
          insights = parsed;
        } else if (parsed && Array.isArray(parsed.insights)) {
          insights = parsed.insights;
        }
      } catch {
        // Try to extract a JSON array [...] from the response text
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
    } catch (error) {
      console.error('Insights error:', error);
      res.status(500).json({ error: "Insights service error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();