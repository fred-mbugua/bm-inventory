// src/utils/asyncHandler.ts
import { Request, Response, NextFunction } from 'express';

// Defining a type for an asynchronous request handler
type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;

// Exporting a higher-order function to wrap async route handlers
export const asyncHandler = (fn: AsyncRequestHandler) =>
  // Returning an Express middleware function
  (req: Request, res: Response, next: NextFunction) => {
    // Executing the asynchronous function and catching any errors
    Promise.resolve(fn(req, res, next)).catch(next);
  };