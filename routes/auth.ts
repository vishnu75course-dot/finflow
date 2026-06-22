import { Router, Request, Response } from "express";
import supabase, { getAuthClient } from "../config/supabaseClient.js";

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Email and password are required' 
      });
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: name || email.split('@')[0] }
    });

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    const authUser = data.user;
    
    const { error: profileError } = await supabase
      .from('users')
      .insert([{
        id: authUser.id,
        name: name || email.split('@')[0],
        email,
        password: 'managed_by_supabase_auth',
        monthly_income: 0,
        currency: 'INR'
      }]);

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }

    res.status(201).json({ 
      status: 'success', 
      message: 'Account created successfully',
      data: { user: authUser }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ status: 'error', message: 'Registration failed' });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Email and password are required' 
      });
    }

    const { data, error } = await getAuthClient().auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ status: 'error', message: error.message });
    }

    res.json({ 
      status: 'success', 
      data: { 
        user: data.user, 
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ status: 'error', message: 'Login failed' });
  }
});

router.post("/logout", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      await supabase.auth.admin.signOut(token);
    }
    res.json({ status: 'success', message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ status: 'error', message: 'Logout failed' });
  }
});

router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ status: 'error', message: 'Refresh token required' });
    }

    const { data, error } = await getAuthClient().auth.refreshSession({ refresh_token });

    if (error) {
      return res.status(401).json({ status: 'error', message: error.message });
    }

    res.json({ 
      status: 'success', 
      data: { 
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ status: 'error', message: 'Token refresh failed' });
  }
});

router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ status: 'error', message: 'Email is required' });
    }

    const { error } = await getAuthClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password`
    });

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    res.json({ status: 'success', message: 'Password reset email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to send reset email' });
  }
});

router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const authHeader = req.headers.authorization;
    
    if (!password) {
      return res.status(400).json({ status: 'error', message: 'Password is required' });
    }
    if (!authHeader) {
      return res.status(401).json({ status: 'error', message: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { error } = await supabase.auth.admin.updateUserById(
      (await getAuthClient().auth.getUser(token)).data.user?.id || '',
      { password }
    );

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    res.json({ status: 'success', message: 'Password updated successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ status: 'error', message: 'Password reset failed' });
  }
});

router.get("/me", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ status: 'error', message: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await getAuthClient().auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ status: 'error', message: 'Invalid token' });
    }

    res.json({ status: 'success', data: { user } });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get user' });
  }
});

export default router;