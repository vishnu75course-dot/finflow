import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors.js';

export interface ValidationSchema {
  [key: string]: {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
    min?: number;
    max?: number;
    enum?: any[];
    pattern?: RegExp;
    custom?: (value: any) => boolean | string;
  };
}

export const validate = (schema: ValidationSchema) => 
  (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }

      if (value === undefined || value === null) continue;

      if (rules.type && typeof value !== rules.type) {
        errors.push(`${field} must be a ${rules.type}`);
      }

      if (rules.type === 'date' && !isNaN(Date.parse(value)) === false) {
        errors.push(`${field} must be a valid date`);
      }

      if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
        errors.push(`${field} must be at least ${rules.min}`);
      }

      if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
        errors.push(`${field} must be at most ${rules.max}`);
      }

      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
      }

      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        errors.push(`${field} format is invalid`);
      }

      if (rules.custom) {
        const result = rules.custom(value);
        if (result !== true) {
          errors.push(typeof result === 'string' ? result : `${field} is invalid`);
        }
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join('; '));
    }

    next();
  };

export const paginationMiddleware = (defaultLimit = 20, maxLimit = 100) => 
  (req: Request, res: Response, next: NextFunction) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit as string) || defaultLimit));
    
    req.query.page = page.toString();
    req.query.limit = limit.toString();
    next();
  };