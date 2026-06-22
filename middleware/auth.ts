import { Request, Response, NextFunction } from "express";
import supabase, { getAuthClient } from "../config/supabaseClient.js";

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Authorization header required' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await getAuthClient().auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Invalid or expired token' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ status: 'error', message: 'Authentication failed' });
  }
}

export async function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await getAuthClient().auth.getUser(token);
      if (user) req.user = user;
    }
    next();
  } catch (error) {
    next();
  }
}