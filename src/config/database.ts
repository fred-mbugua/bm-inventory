import { Pool } from 'pg';
import { logger } from './logger';
import dotenv from 'dotenv';

// Loading environment variables for database connection
dotenv.config();

// Creating a new PostgreSQL connection pool
const pool = new Pool({
  // Setting the database host from environment variables
  host: process.env.DB_HOST,
  // Setting the database port from environment variables, converting to number
  port: parseInt(process.env.DB_PORT || '5432'),
  // Setting the database user from environment variables
  user: process.env.DB_USER,
  // Setting the database password from environment variables
  password: process.env.DB_PASSWORD,
  // Setting the database name from environment variables
  database: process.env.DB_NAME,
  // Setting the maximum number of clients in the pool
  max: 20,
  // Setting the idle timeout for clients in milliseconds
  idleTimeoutMillis: 30000,
  // Setting the connection timeout for new clients in milliseconds
  connectionTimeoutMillis: 2000,
});

// Function for establishing database connection
export const connectDB = async () => {
  try {
    // Attempting to acquire a client from the pool to test connection
    await pool.query('SELECT 1');
    // Logging successful connection to the database
    logger.info('PostgreSQL connected.');
  } catch (err) {
    // Logging any errors during connection attempt
    logger.error('PostgreSQL connection error:', err);
    // Throwing the error to be caught by the calling function (server.ts)
    throw err;
  }
};

// Function for executing database queries
export const query = async <T>(text: string, params: any[] = []): Promise<T[]> => {
  // Acquiring a client from the pool
  const client = await pool.connect();
  try {
    // Logging the query being executed in development mode
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Executing query: ${text} with params: ${JSON.stringify(params)}`);
    }
    // Executing the query with provided text and parameters
    const res = await client.query(text, params);
    // Returning the rows from the query result
    return res.rows;
  } catch (err) {
    // Logging query execution errors
    logger.error('Database query error:', err);
    // Throwing the error for upstream handling
    throw err;
  } finally {
    // Releasing the client back to the pool
    client.release();
  }
};

// Function for executing database queries within a transaction
export const transaction = async <T>(callback: (client: any) => Promise<T>): Promise<T> => {
  // Acquiring a client from the pool for the transaction
  const client = await pool.connect();
  try {
    // Starting a new transaction
    await client.query('BEGIN');
    // Executing the callback function with the client
    const result = await callback(client);
    // Committing the transaction if callback is successful
    await client.query('COMMIT');
    // Returning the result from the callback
    return result;
  } catch (e) {
    // Rolling back the transaction if any error occurs
    await client.query('ROLLBACK');
    // Logging the transaction error
    logger.error('Transaction rolled back due to error:', e);
    // Rethrowing the error
    throw e;
  } finally {
    // Releasing the client back to the pool
    client.release();
  }
};