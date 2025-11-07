import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_ACCESS_TOKEN_EXPIRATION, JWT_REFRESH_TOKEN_EXPIRATION } from '@config/jwt';

// Defining the structure for the payload stored in the JWT
interface JwtPayload {
  id: string; // User ID
  roleId: string; // User's role ID
  permissions: string[]; // List of user's permissions
}

/**
 * Generating a new access token.
 * @param payload The data to be included in the token (User ID, Role ID, Permissions).
 * @returns The generated JWT string.
 */
export const generateAccessToken = (payload: JwtPayload): string => {
  // Signing the payload to create an access token
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: 7, // Setting the expiration time
  });
};

/**
 * Generating a new refresh token (longer lived).
 * @param payload The data to be included in the token (User ID, Role ID, Permissions).
 * @returns The generated JWT string.
 */
export const generateRefreshToken = (payload: JwtPayload): string => {
  // Signing the payload to create a refresh token
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_TOKEN_EXPIRATION, // Setting the long expiration time
  });
};

/**
 * Verifying and decoding a JWT token.
 * @param token The JWT string to verify.
 * @returns The decoded payload if valid, or throws an error.
 */
export const verifyToken = (token: string): JwtPayload => {
  // Verifying the token signature and expiration
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};