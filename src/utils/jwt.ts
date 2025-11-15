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
    expiresIn: JWT_ACCESS_TOKEN_EXPIRATION, // Setting the expiration time
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
  try {
   
    // Verify token once and store the result
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    
    // Re-throw with more specific error messages
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    } else if (error instanceof jwt.NotBeforeError) {
      throw new Error('Token not active yet');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

/**
 * Utility function to check if a token is properly formatted
 * @param token The token string to check
 * @returns boolean indicating if token format is valid
 */
export const isValidTokenFormat = (token: string): boolean => {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Check if token has the expected JWT format (3 parts separated by dots)
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
};