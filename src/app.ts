import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Importing the global logger
import { logger } from '@config/logger';
// Importing custom error handling utilities
import { CustomError } from '@utils/errorHandler';
import { asyncHandler } from '@utils/asyncHandler';
// Importing the log service for recording actions
// import { logService } from '@services/log.service';

// Importing route modules
import authRoutes from '@routes/auth.routes';
import userRoutes from '@routes/users.routes';
import roleRoutes from '@routes/roles.routes';
// import deviceRoutes from '@routes/devices.routes';
// import saleRoutes from '@routes/sales.routes';
// import configurationRoutes from '@routes/configurations.routes';
// import reportRoutes from '@routes/reports.routes'; // Will be created later

// Creating a new Express application instance
const app = express();

// Applying Helmet middleware for enhancing application security
app.use(helmet());

// Enabling CORS with a flexible configuration (adjust for production environments)
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Allowing all origins for development, specify client URL for production
  credentials: true, // Allowing cookies to be sent with requests
}));

// Parsing incoming JSON requests
app.use(express.json());

// Parsing URL-encoded data with extended options
app.use(express.urlencoded({ extended: true }));

// Parsing cookies attached to the client request
app.use(cookieParser(process.env.COOKIE_SECRET)); // Using a secret for signed cookies

// Custom middleware for request logging
app.use((req, res, next) => {
  // Logging the method and original URL of each incoming request
  logger.info(`Request: ${req.method} ${req.originalUrl}`);
  // Proceeding to the next middleware or route handler
  next();
});

// Defining the root endpoint of the API
app.get('/', (req, res) => {
  // Sending a welcome message for the Inventory Management API
  res.send('Welcome to the Inventory Management API!');
});

// Mounting authentication-related routes
app.use('/api/auth', authRoutes);
// Mounting user management routes
app.use('/api/users', userRoutes);
// Mounting role and permission management routes
app.use('/api/roles', roleRoutes);
// Mounting device (mobile phone) management routes
// app.use('/api/devices', deviceRoutes);
// // Mounting sales transaction routes
// app.use('/api/sales', saleRoutes);
// // Mounting application configuration routes
// app.use('/api/configurations', configurationRoutes);
// // Mounting reporting routes (for admins and sales persons)
// app.use('/api/reports', reportRoutes);

// Handling 404 Not Found errors for any unhandled routes
app.use((req, res, next) => {
  // Creating a CustomError for not found routes
  const error = new CustomError(`Not Found - ${req.originalUrl}`, 404);
  // Passing the error to the next error handling middleware
  next(error);
});

// Global error handling middleware
app.use((err: Error | CustomError, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Determining the status code from the error, defaulting to 500
  const statusCode = err instanceof CustomError ? err.statusCode : 500;
  // Determining the error message, providing a generic one for unhandled errors
  const message = err instanceof CustomError ? err.message : 'Internal Server Error';

  // Logging the error using the logger, including stack trace in development
  logger.error(`${statusCode} - ${message}`, err instanceof CustomError ? err.stack : err.stack);

  // Asynchronously logging the error to the database
  // asyncHandler(async () => {
  //   // Storing detailed error information in the database
  //   await logService.logError('application_error', message, err.stack, {
  //     url: req.originalUrl,
  //     method: req.method,
  //     ip: req.ip,
  //     // Adding user ID if available from authentication
  //     userId: (req as any).user ? (req as any).user.id : null,
  //   });
  // })(); // Immediately invoking the asyncHandler wrapped function

  // Sending the error response to the client
  res.status(statusCode).json({
    // Including the error message
    message: message,
    // Including the stack trace only in development mode for debugging
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// Exporting the configured Express application
export { app };