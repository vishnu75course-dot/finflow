import { Router, Request, Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";
import supabase from "../config/supabaseClient.js";

const router = Router();

router.use(authMiddleware);

// ==========================================
// TRANSACTIONS ROUTES
// ==========================================

router.get("/transactions", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ status: 'success', data });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch transactions' });
  }
});

router.post("/transactions", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount, category, title, description, type, date } = req.body;
    const finalTitle = title || description || 'Untitled';
    
    const { data, error } = await supabase
      .from('transactions')
      .insert([{ user_id: req.user.id, amount, category, title: finalTitle, type, date }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ status: 'success', data });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create transaction' });
  }
});

router.put("/transactions/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, category, title, description, type, date } = req.body;
    const finalTitle = title !== undefined || description !== undefined ? (title || description) : undefined;
    
    const updateData: any = { amount, category, type, date };
    if (finalTitle !== undefined) updateData.title = finalTitle;

    const { data, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ status: 'success', data });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update transaction' });
  }
});

router.delete("/transactions/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ status: 'success', message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete transaction' });
  }
});

// ==========================================
// BUDGETS ROUTES (with dynamic spent calculations)
// ==========================================

router.get("/budgets", async (req: AuthenticatedRequest, res: Response) => {
  try {
    // 1. Fetch user budgets
    const { data: budgets, error: budgetsErr } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', req.user.id);

    if (budgetsErr) throw budgetsErr;

    // 2. Fetch user transactions to calculate spent amount on the fly
    const { data: txs, error: txsErr } = await supabase
      .from('transactions')
      .select('amount, category, type')
      .eq('user_id', req.user.id)
      .eq('type', 'expense');

    if (txsErr) throw txsErr;

    // Map limit_amount to limit for frontend compatibility and calculate spent dynamically
    const mapped = budgets.map((b: any) => {
      const spent = txs
        ? txs
            .filter((t: any) => t.category === b.category)
            .reduce((sum: number, t: any) => sum + Number(t.amount), 0)
        : 0;

      return {
        id: b.id,
        category: b.category,
        limit: b.limit_amount,
        spent: spent
      };
    });

    res.json({ status: 'success', data: mapped });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch budgets' });
  }
});

// POST acts as an upsert for budgets by category
router.post("/budgets", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, limit, limit_amount } = req.body;
    const finalLimit = limit !== undefined ? limit : limit_amount;

    // Check if budget exists for this category
    const { data: existing, error: findError } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('category', category)
      .maybeSingle();

    if (findError) throw findError;

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('budgets')
        .update({ 
          limit_amount: finalLimit
        })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('budgets')
        .insert([{ 
          user_id: req.user.id, 
          category, 
          limit_amount: finalLimit || 0
        }])
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    // Get current spent on the fly for the category
    const { data: txs, error: txsErr } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', req.user.id)
      .eq('category', category)
      .eq('type', 'expense');

    const spent = txs ? txs.reduce((sum: number, t: any) => sum + Number(t.amount), 0) : 0;

    const mapped = {
      id: result.id,
      category: result.category,
      limit: result.limit_amount,
      spent: spent
    };

    res.status(existing ? 200 : 201).json({ status: 'success', data: mapped });
  } catch (error) {
    console.error('Save budget error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to save budget' });
  }
});

router.delete("/budgets/:category", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category } = req.params;
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('category', category)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ status: 'success', message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete budget' });
  }
});

// ==========================================
// GOALS ROUTES
// ==========================================

router.get("/goals", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ status: 'success', data });
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch goals' });
  }
});

router.post("/goals", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, title, target_amount, target, current_amount, current } = req.body;
    const finalTitle = title || name;
    const finalTarget = target !== undefined ? target : target_amount;
    const finalCurrent = current !== undefined ? current : (current_amount || 0);

    const { data, error } = await supabase
      .from('goals')
      .insert([{
        user_id: req.user.id,
        title: finalTitle,
        target: finalTarget,
        current: finalCurrent
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ status: 'success', data });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create goal' });
  }
});

router.put("/goals/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, title, target_amount, target, current_amount, current } = req.body;
    
    const updateData: any = {};
    if (title !== undefined || name !== undefined) updateData.title = title || name;
    if (target !== undefined || target_amount !== undefined) updateData.target = target !== undefined ? target : target_amount;
    if (current !== undefined || current_amount !== undefined) updateData.current = current !== undefined ? current : current_amount;

    const { data, error } = await supabase
      .from('goals')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ status: 'success', data });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update goal' });
  }
});

router.delete("/goals/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ status: 'success', message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete goal' });
  }
});

// ==========================================
// REMINDERS ROUTES
// ==========================================

router.get("/reminders", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', req.user.id);

    if (error) throw error;

    // Map columns for frontend compatibility (due_date to dueDate)
    const mapped = data.map((r: any) => ({
      id: r.id,
      title: r.title,
      amount: r.amount,
      category: r.category,
      dueDate: r.due_date,
      status: r.status
    }));

    res.json({ status: 'success', data: mapped });
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch reminders' });
  }
});

router.post("/reminders", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, amount, category, dueDate, due_date, status } = req.body;
    const finalDueDate = due_date || dueDate;

    const { data, error } = await supabase
      .from('reminders')
      .insert([{
        user_id: req.user.id,
        title,
        amount,
        category,
        due_date: finalDueDate,
        status: status || 'pending'
      }])
      .select()
      .single();

    if (error) throw error;

    const mapped = {
      id: data.id,
      title: data.title,
      amount: data.amount,
      category: data.category,
      dueDate: data.due_date,
      status: data.status
    };

    res.status(201).json({ status: 'success', data: mapped });
  } catch (error) {
    console.error('Create reminder error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create reminder' });
  }
});

router.put("/reminders/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, amount, category, dueDate, due_date, status } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (amount !== undefined) updateData.amount = amount;
    if (category !== undefined) updateData.category = category;
    if (due_date !== undefined || dueDate !== undefined) updateData.due_date = due_date || dueDate;
    if (status !== undefined) updateData.status = status;

    const { data, error } = await supabase
      .from('reminders')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    const mapped = {
      id: data.id,
      title: data.title,
      amount: data.amount,
      category: data.category,
      dueDate: data.due_date,
      status: data.status
    };

    res.json({ status: 'success', data: mapped });
  } catch (error) {
    console.error('Update reminder error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update reminder' });
  }
});

router.delete("/reminders/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ status: 'success', message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete reminder' });
  }
});

// ==========================================
// INSIGHTS ROUTES
// ==========================================

router.get("/insights", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('insights')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ status: 'success', data });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch insights' });
  }
});

router.post("/insights", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, message, category } = req.body;
    const { data, error } = await supabase
      .from('insights')
      .insert([{ user_id: req.user.id, type, message, category }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ status: 'success', data });
  } catch (error) {
    console.error('Create insight error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create insight' });
  }
});

// ==========================================
// PROFILE ROUTES
// ==========================================

router.get("/profile", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, monthly_income, currency, created_at')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      const mapped = {
        id: data.id,
        name: data.name,
        email: data.email,
        monthlyIncome: data.monthly_income,
        currency: data.currency,
        created_at: data.created_at
      };
      return res.json({ status: 'success', data: mapped });
    }

    // Auto-create profile row if missing (Self-healing)
    // First, check if there is an existing user row with the same email
    const { data: emailMatch } = await supabase
      .from('users')
      .select('*')
      .eq('email', req.user.email)
      .maybeSingle();

    let newProfile;
    if (emailMatch) {
      // Try to update the ID of the existing row to req.user.id
      const { data: updated, error: updateIdErr } = await supabase
        .from('users')
        .update({ id: req.user.id })
        .eq('id', emailMatch.id)
        .select()
        .maybeSingle();

      if (!updateIdErr && updated) {
        newProfile = updated;
      } else {
        // If updating ID failed (e.g. FK constraint), delete the old row and insert a new one
        await supabase.from('users').delete().eq('id', emailMatch.id);
        
        const { data: inserted, error: insertError } = await supabase
          .from('users')
          .insert([{
            id: req.user.id,
            name: req.user.user_metadata?.name || req.user.email?.split('@')[0] || 'User',
            email: req.user.email,
            password: 'managed_by_supabase_auth',
            monthly_income: 0,
            currency: 'INR'
          }])
          .select()
          .single();
        if (insertError) throw insertError;
        newProfile = inserted;
      }
    } else {
      // No email match, just insert a new row
      const { data: inserted, error: insertError } = await supabase
        .from('users')
        .insert([{
          id: req.user.id,
          name: req.user.user_metadata?.name || req.user.email?.split('@')[0] || 'User',
          email: req.user.email,
          password: 'managed_by_supabase_auth',
          monthly_income: 0,
          currency: 'INR'
        }])
        .select()
        .single();
      if (insertError) throw insertError;
      newProfile = inserted;
    }

    const mappedNew = {
      id: newProfile.id,
      name: newProfile.name,
      email: newProfile.email,
      monthlyIncome: newProfile.monthly_income,
      currency: newProfile.currency,
      created_at: newProfile.created_at
    };

    res.json({ status: 'success', data: mappedNew });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch profile' });
  }
});

router.put("/profile", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, monthlyIncome, monthly_income, currency } = req.body;
    const finalMonthlyIncome = monthlyIncome !== undefined ? monthlyIncome : monthly_income;

    const { data, error } = await supabase
      .from('users')
      .update({ 
        name, 
        monthly_income: finalMonthlyIncome, 
        currency 
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    const mapped = {
      id: data.id,
      name: data.name,
      email: data.email,
      monthlyIncome: data.monthly_income,
      currency: data.currency,
      created_at: data.created_at
    };

    res.json({ status: 'success', data: mapped });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update profile' });
  }
});

export default router;