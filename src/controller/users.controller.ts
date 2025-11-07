import { Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler';
import { AuthenticatedRequest } from '@middlewares/auth.middleware';
import * as userService from '@services/user.service';
import { CustomError } from '@utils/errorHandler';

/**
 * Getting all users (Admin/Manager visibility).
 */
export const getUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Calling the service to fetch all users
  const users = await userService.getAllUsers();
  // Responding with the list of users
  res.status(200).json({ success: true, data: users });
});

/**
 * Getting a single user by ID.
 */
export const getUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Extracting user ID from request parameters
  const { id } = req.params;
  // Calling the service to fetch a single user
  const user = await userService.getUserById(id);

  // Checking if the user was found
  if (!user) {
    // Throwing a 404 error if user not found
    throw new CustomError(`User with ID ${id} not found.`, 404);
  }

  // Responding with the user data
  res.status(200).json({ success: true, data: user });
});

/**
 * Creating a new user.
 */
export const createUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Extracting user data from the request body
  const { username, email, password, fullName, roleId } = req.body;
  // Ensuring all required fields are present
  if (!username || !email || !password || !fullName || !roleId) {
    // Throwing a 400 error for missing required fields
    throw new CustomError('Please provide username, email, password, full name, and role ID.', 400);
  }

  // Calling the service to create the user, passing the creator's ID from the token
  const newUser = await userService.createUser(
    { username, email, password, fullName, roleId },
    req.user!.id
  );

  // Responding with the newly created user (excluding password)
  res.status(201).json({ success: true, message: 'User created successfully.', data: newUser });
});

/**
 * Updating an existing user.
 */
export const updateUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Extracting user ID from request parameters
  const { id } = req.params;
  // Extracting fields to update from the request body
  const updates = req.body;

  // Calling the service to update the user
  const updatedUser = await userService.updateUser(id, updates, req.user!.id);

  // Checking if the user was found and updated
  if (!updatedUser) {
    // Throwing a 404 error if user not found
    throw new CustomError(`User with ID ${id} not found.`, 404);
  }

  // Responding with the updated user data
  res.status(200).json({ success: true, message: 'User updated successfully.', data: updatedUser });
});