import { Request, Response, NextFunction } from 'express';
import { logger } from '@config/logger'; // Assuming logger is available

// Custom error class for handling expected API errors
export class CustomError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Indicates it's an expected, handled error
    
    // Capturing the stack trace (important for debugging)
    Error.captureStackTrace(this, this.constructor);
  }
}

// The core Express Error Handling Middleware
// NOTE: It must have four arguments (err, req, res, next)
const errorHandler = (
  err: Error, // The error object caught
  req: Request, 
  res: Response, 
  next: NextFunction // Required but often unused in the final handler
) => {
  // 1. Determine Status Code and Message
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof CustomError) {
    // Handle our custom, operational errors
    statusCode = err.statusCode;
    message = err.message;
  } else {
    // Handle unexpected/system errors
    // Log the full stack trace for non-operational errors
    logger.error('UNEXPECTED SERVER ERROR:', err); 
    // If in development, send the stack trace; otherwise, hide it
    if (process.env.NODE_ENV === 'development') {
      message = `${err.message} - ${err.stack}`;
    } else {
      message = 'A critical error occurred.';
    }
  }

  // 2. Send the Error Response
  res.status(statusCode).json({
    success: false,
    error: message,
  });
};

// Use a DEFAULT EXPORT for simplicity, matching the common import syntax
export default errorHandler;