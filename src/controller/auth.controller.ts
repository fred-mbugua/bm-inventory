import { Request, Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler';
import { loginUser, refreshAccessToken } from '@services/auth.service';
import { JWT_REFRESH_TOKEN_EXPIRATION } from '@config/jwt';
import { CustomError } from '@utils/errorHandler';
import * as roleService from '@services/role.service';
import * as userService from '@services/user.service';


// Defining token expiration in milliseconds for cookie settings
const REFRESH_TOKEN_EXPIRY_MS = parseInt(JWT_REFRESH_TOKEN_EXPIRATION) * 24 * 60 * 60 * 1000; // Assuming 7d in .env

/**
 * Setting JWT tokens as signed, HTTP-only cookies.
 * @param res The Express response object.
 * @param accessToken The JWT access token.
 * @param refreshToken The JWT refresh token.
 */
const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  // Setting the access token in an HTTP-only cookie
  res.cookie('accessToken', accessToken, {
    httpOnly: true, // Preventing client-side JavaScript access
    secure: process.env.NODE_ENV === 'production', // Sending only over HTTPS in production
    signed: true, // Protecting against client tampering
    sameSite: 'strict', // Protecting against CSRF attacks
    maxAge: 15 * 60 * 1000, // 15 minutes (or whatever ACCESS_TOKEN_EXPIRATION is)
  });

  // Setting the refresh token in an HTTP-only cookie (longer lifespan)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    signed: true,
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_EXPIRY_MS, // 7 days (or whatever REFRESH_TOKEN_EXPIRATION is)
  });
};

/**
 * Handling user login and setting secure cookies.
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  // Extracting identifier (username/email) and password from the request body
  const { identifier, password } = req.body;

  // Calling the authentication service to validate credentials and generate tokens
  const { tokens, userId } = await loginUser(identifier, password);

  // Setting the access and refresh tokens in HTTP-only cookies
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

  // Responding with a success message and the user ID
  res.status(200).json({
    success: true,
    message: 'Login successful.',
    userId,
    accessToken: tokens.accessToken, // Returning token in body for client convenience (optional, can be removed for pure cookie security)
  });
});

/**
 * Handling token refresh using the refresh token from cookies.
 */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  // Extracting the refresh token from the signed cookies
  const refreshToken = req.signedCookies.refreshToken;

  // Checking if the refresh token exists
  if (!refreshToken) {
    // Throwing an error if no refresh token is provided
    return res.status(401).json({ message: 'Refresh token missing.' });
  }

  // Calling the service to generate a new access token
  const { accessToken, refreshToken: newRefreshToken } = await refreshAccessToken(refreshToken);

  // Setting the new access token (the refresh token remains the same)
  setAuthCookies(res, accessToken, newRefreshToken);

  // Responding with the new access token
  res.status(200).json({
    success: true,
    message: 'Access token refreshed.',
    accessToken,
  });
});

/**
 * Handling user logout by clearing the authentication cookies.
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  // Clearing the access token cookie
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    signed: true,
    sameSite: 'strict',
  });

  // Clearing the refresh token cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    signed: true,
    sameSite: 'strict',
  });

  // Responding with a success message
  res.status(200).json({ success: true, message: 'Logout successful.' });
});


/**
 * Handles the registration of a new user.
 * This endpoint is typically used for initial setup or public registration,
 * and usually assigns a default, restricted role (e.g., 'Sales Associate').
 */
export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password, fullName, initialRoleId } = req.body;

  // Basic Validation
  if (!username || !email || !password || !fullName) {
    throw new CustomError('Username, email, password, and full name are required for registration.', 400);
  }

  // Determine Role ID
  let roleIdToAssign = initialRoleId;
  
  if (!roleIdToAssign) {
    // In a public setup, you'd fetch the ID of the default 'Sales Associate' role.
    const defaultRole = await roleService.findRoleByName('Sales Associate');
    if (!defaultRole) {
      // Critical system failure if the default role is missing
      throw new CustomError('System setup error: Default role "Sales Associate" is not configured.', 500);
    }
    roleIdToAssign = defaultRole.id;
  } else {
    // If an initialRoleId is provided, ensure the user can set it (e.g., for initial Admin setup)
    // For simplicity, we trust the provided ID here, but in production, this needs tighter control.
    const roleExists = await roleService.findRoleById(roleIdToAssign);
    if (!roleExists) {
        throw new CustomError('Invalid role ID provided.', 400);
    }
  }

  // Create the User Account (createdByUserId is null for self-registration)
  const newUser = await userService.createUserAccount({
    username,
    email,
    password,
    fullName,
    roleId: roleIdToAssign,
    // Add other default fields like 'isActive: true' if necessary in the service.
  } as any, null); 

  res.status(201).json({
    success: true,
    message: 'Registration successful. Account created.',
    data: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      fullName: newUser.fullName,
      roleId: newUser.roleId
    },
  });
});


// export const registerUser = asyncHandler(async (req: Request, res: Response) => {
//   const { username, email, password, fullName, initialRoleId } = req.body;

//   // Basic Validation
//   if (!username || !email || !password || !fullName) {
//     throw new CustomError('Username, email, password, and full name are required for registration.', 400);
//   }

//   //Determine Role ID
//   let roleIdToAssign = initialRoleId;
  
//   if (!roleIdToAssign) {
//     // Uses the new roleService.findRoleByName
//     const defaultRole = await roleService.findRoleByName('Sales Associate');
//     if (!defaultRole) {
//       throw new CustomError('System setup error: Default role "Sales Associate" is not configured.', 500);
//     }
//     roleIdToAssign = defaultRole.id;
//   } else {
//     // Uses the new roleService.findRoleById
//     const roleExists = await roleService.findRoleById(roleIdToAssign);
//     if (!roleExists) {
//         throw new CustomError('Invalid role ID provided.', 400);
//     }
//   }

//   // Create the User Account
//   const newUser = await userService.createUserAccount({ /* ... */ } as any, null); 
//   res.status(201).json({ /* ... */ });
// });