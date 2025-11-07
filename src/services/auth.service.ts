import { findUserByUsernameOrEmailForAuth } from '@models/user.model';
import { getUserPermissions } from '@models/auth.model';
import { comparePassword } from '@utils/password';
import { generateAccessToken, generateRefreshToken, verifyToken } from '@utils/jwt';
import { CustomError } from '@utils/errorHandler';
import { logService } from './log.service';

// Defining the structure for the tokens returned on successful authentication
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Handling the user login process.
 * @param identifier Username or email.
 * @param password Plain text password.
 * @returns An object containing the access and refresh tokens.
 */
export const loginUser = async (identifier: string, password: string): Promise<{ tokens: AuthTokens; userId: string }> => {
  // Retrieving the user, password, and role name from the database
  const user = await findUserByUsernameOrEmailForAuth(identifier);

  // Checking if the user exists and is active
  if (!user || !user.isActive) {
    // Throwing an error if user not found or inactive
    throw new CustomError('Invalid credentials or user is inactive.', 401);
  }

  // Comparing the provided password with the stored hashed password
  const isMatch = await comparePassword(password, user.password);

  // Checking if the passwords match
  if (!isMatch) {
    // Throwing an error on password mismatch
    throw new CustomError('Invalid credentials.', 401);
  }

  // Fetching the user's active permissions
  const permissions = await getUserPermissions(user.id);

  // Defining the payload for the JWT tokens
  const payload = {
    id: user.id,
    roleId: user.roleId,
    permissions,
  };

  // Generating both access and refresh tokens
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Logging the successful login action
  await logService.logAction('LOGIN_SUCCESS', user.id, 'User', user.id, {
    username: user.username,
    role: user.roleName,
  });

  // Returning the tokens and user ID
  return { tokens: { accessToken, refreshToken }, userId: user.id };
};

/**
 * Handling the token refresh process using a refresh token.
 * @param token The refresh token string.
 * @returns A new access token and the original refresh token.
 */
export const refreshAccessToken = async (token: string): Promise<AuthTokens> => {
  try {
    // Verifying and decoding the refresh token
    const decoded = verifyToken(token);

    // Casting the decoded payload to the expected type
    const payload = decoded as { id: string; roleId: string };

    // Fetching the latest permissions for the user
    const permissions = await getUserPermissions(payload.id);

    // Creating a new payload with updated permissions
    const newPayload = {
      id: payload.id,
      roleId: payload.roleId,
      permissions,
    };

    // Generating a new access token
    const newAccessToken = generateAccessToken(newPayload);

    // Returning the new access token and the original refresh token
    return { accessToken: newAccessToken, refreshToken: token };
  } catch (error) {
    // Throwing an error if the refresh token is invalid or expired
    throw new CustomError('Invalid or expired refresh token.', 401);
  }
};