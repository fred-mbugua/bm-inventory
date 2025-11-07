import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@utils/jwt';
import { asyncHandler } from '@utils/asyncHandler';
import { CustomError } from '@utils/errorHandler';
import { getUserPermissions } from '@models/auth.model';

// Extending the Request object to include user information
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    roleId: string;
    permissions: string[];
  };
}

/**
 * Middleware for protecting routes by verifying the access token in cookies.
 */
export const protect = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Extracting the access token from the signed cookies
  const token = req.signedCookies.accessToken;

  // Checking if the token exists
  if (!token) {
    // Throwing an error if no token is provided
    throw new CustomError('Not authorized, no token provided.', 401);
  }

  try {
    // Verifying and decoding the token
    const decoded = verifyToken(token);

    // Casting the decoded payload to the user structure
    const userPayload = decoded as { id: string; roleId: string; permissions: string[] };

    // Attaching the user payload (including ID, RoleID, and Permissions) to the request object
    req.user = userPayload;

    // Proceeding to the next middleware or controller
    next();
  } catch (error) {
    // Logging token verification failure
    // If token is invalid (e.g., expired, bad signature), throwing an authentication error
    throw new CustomError('Not authorized, token failed verification.', 401);
  }
});

/**
 * Middleware for checking if the authenticated user has the required permissions.
 * @param requiredPermissions An array of permission names required to access the route.
 */
export const authorize = (requiredPermissions: string[]) => {
  // Returning the middleware function
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Checking if the user object exists on the request
    if (!req.user) {
      // Throwing an error if the protect middleware failed or was skipped
      throw new CustomError('Authorization context missing.', 500);
    }

    // Checking if the user possesses ALL of the required permissions
    const hasPermission = requiredPermissions.every(permission =>
      req.user!.permissions.includes(permission)
    );

    // Checking if the user has permission
    if (hasPermission) {
      // Proceeding if authorization is successful
      next();
    } else {
      // Throwing an error if the user lacks the required permission(s)
      throw new CustomError('Forbidden: You do not have the necessary permissions to perform this action.', 403);
    }
  };
};