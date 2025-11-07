import dotenv from 'dotenv';

// Loading environment variables
dotenv.config();

// Defining JWT secret from environment variables
export const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_default_key';
// Defining access token expiration time from environment variables
export const JWT_ACCESS_TOKEN_EXPIRATION = process.env.JWT_ACCESS_TOKEN_EXPIRATION || '15m';
// Defining refresh token expiration time from environment variables
export const JWT_REFRESH_TOKEN_EXPIRATION = process.env.JWT_REFRESH_TOKEN_EXPIRATION || '7d';