import { createLogger, format, transports } from 'winston';
import path from 'path';
import fs from 'fs';

// Defining the log directory path
const logDir = path.join(__dirname, '../../logs');

// Ensuring the log directory exists
if (!fs.existsSync(logDir)) {
  // Creating the log directory if it does not exist
  fs.mkdirSync(logDir);
}

// Defining custom log format for console output
const consoleLogFormat = format.printf(({ level, message, timestamp, stack }) => {
  // Returning formatted string for console
  return `${timestamp} ${level}: ${stack || message}`;
});

// Creating a Winston logger instance
export const logger = createLogger({
  // Setting the default log level based on environment
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  // Defining common log formats
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Adding timestamp to logs
    format.errors({ stack: true }), // Capturing stack traces for errors
    format.splat(), // Handling string interpolation
    format.json() // Outputting logs as JSON for file storage
  ),
  // Defining log transports (where logs are sent)
  transports: [
    // Console transport for development readability
    new transports.Console({
      // Setting console log format with colorization
      format: format.combine(
        format.colorize(), // Adding colors to log levels
        consoleLogFormat // Using the custom console format
      ),
    }),
    // File transport for all info level logs
    new transports.File({ filename: path.join(logDir, 'combined.log'), level: 'info' }),
    // Separate file transport for error level logs
    new transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
  ],
  // Configuring to not exit on unhandled exceptions for robust error handling
  exitOnError: false,
});