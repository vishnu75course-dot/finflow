import { Request, Response, NextFunction } from 'express';
import { errorResponse, ApiResponse } from './responses.js';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export const asyncHandler = (fn: Function) => 
  (req: Request, res: Response, next: NextFunction) => 
    Promise.resolve(fn(req, res, next)).catch(next);

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    const { response, statusCode } = errorResponse(err.message, err.statusCode);
    return res.status(statusCode).json(response);
  }

  if (err.name === 'ValidationError') {
    const { response, statusCode } = errorResponse(err.message, 400);
    return res.status(statusCode).json(response);
  }

  if (err.name === 'UnauthorizedError' || err.message.includes('JWT')) {
    const { response, statusCode } = errorResponse('Unauthorized', 401);
    return res.status(statusCode).json(response);
  }

  const { response, statusCode } = errorResponse('Internal server error', 500);
  return res.status(statusCode).json(response);
};

export const notFoundHandler = (req: Request, res: Response) => {
  const { response, statusCode } = errorResponse('Route not found', 404);
  res.status(statusCode).json(response);
};