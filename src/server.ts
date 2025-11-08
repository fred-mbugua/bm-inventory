import 'tsconfig-paths/register'; // Resolve TS path aliases at runtime (matches dev script)
import app from './app';
import { logger } from '@config/logger';
import { connectDB } from '@config/database'; // Assuming this function connects/pings the DB

// Defining the port from environment variables or defaulting to 5000
const PORT = process.env.PORT || 5000;

// The main function to initialize the server
async function startServer() {
  try {
    // 1. Connect to the PostgreSQL database
    await connectDB();
    logger.info('Database connection established successfully.');

    // 2. Start listening for requests
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}.`);
      logger.info(`API entry point: /api`);
    });
  } catch (error) {
    // Logging any critical startup errors and exiting
    logger.error('CRITICAL: Server failed to start due to an error.', error);
    process.exit(1);
  }
}

// Starting the server application
startServer();