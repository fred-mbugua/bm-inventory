import dotenv from 'dotenv';
import { app } from './app';
import { logger } from '@config/logger';
import { connectDB } from '@config/database';

// Loading environment variables from .env file
dotenv.config();

// Defining the port the server will listen on
const PORT = process.env.PORT || 3000;

// Connecting to the PostgreSQL database
connectDB()
  .then(() => {
    // Logging successful database connection
    logger.info('Database connected successfully.');
    // Starting the Express application server
    app.listen(PORT, () => {
      // Logging the server's listening address
      logger.info(`Server running on port ${PORT}.`);
    });
  })
  .catch((error) => {
    // Logging any errors encountered during database connection
    logger.error('Failed to connect to database:', error);
    // Exiting the process with an error code if database connection fails
    process.exit(1);
  });