import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { logger } from './logger';

// Loading environment variables
dotenv.config();

// Creating a Nodemailer transporter using SMTP
export const transporter = nodemailer.createTransport({
  // Setting the SMTP host from environment variables
  host: process.env.MAIL_HOST,
  // Setting the SMTP port from environment variables, converting to number
  port: parseInt(process.env.MAIL_PORT || '587'),
  // Disabling secure connection for specific ports (e.g., Mailtrap's 2525)
  secure: false, // Use 'true' for 465, 'false' for other ports like 587 or 2525
  // Setting authentication details
  auth: {
    // Setting the SMTP user from environment variables
    user: process.env.MAIL_USER,
    // Setting the SMTP password from environment variables
    pass: process.env.MAIL_PASS,
  },
  // Adding logging for Nodemailer actions in development
  logger: process.env.NODE_ENV === 'development',
  // Allowing insecure connections for testing in development
  allowUnauthorized: process.env.NODE_ENV === 'development' // Required for some development SMTP servers
});

// Verifying the transporter connection
transporter.verify((error, success) => {
  if (error) {
    // Logging an error if transporter verification fails
    logger.error('Nodemailer transporter verification failed:', error);
  } else {
    // Logging success message if transporter is ready
    logger.info('Nodemailer is ready to send emails.');
  }
});

// Defining the default sender email address
export const MAIL_FROM_EMAIL = process.env.MAIL_FROM_EMAIL || 'noreply@example.com';