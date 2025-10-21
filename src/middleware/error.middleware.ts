import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorMiddleware = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) {
    return next(error);
  }

  // Log error
  logger.error('Unhandled Error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
  });

  // AppError handling
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.message,
      success: false,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  }

  // Default error handling
  const statusCode = 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;

  res.status(statusCode).json({
    error: message,
    success: false,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};
