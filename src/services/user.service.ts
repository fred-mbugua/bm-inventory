import {
  findAllUsers,
  findUserById,
  createUser as modelCreateUser,
  updateUser as modelUpdateUser,
  User,
  UserWithRole,
} from '@models/user.model';
import * as roleModel from '@models/role.model';
import { findRoleWithPermissionsById } from '@models/role.model';
import { hashPassword } from '@utils/password';
import { CustomError } from '@utils/errorHandler';
import { logService } from './log.service';
import { query } from '@config/database';

/**
 * Retrieving all users with their role details.
 * @returns A promise that resolves to an array of users.
 */
export const getAllUsers = async (): Promise<UserWithRole[]> => {
  // Delegating to the model to fetch all users
  return findAllUsers();
};

/**
 * Retrieving a single user by ID.
 * @param id The ID of the user.
 * @returns A promise that resolves to the user or null.
 */
export const getUserById = async (id: string): Promise<UserWithRole | null> => {
  // Delegating to the model to fetch a user by ID
  return findUserById(id);
};

/**
 * Creating a new user.
 * @param userData The data for the new user (username, email, password, fullName, roleId).
 * @param creatorId The ID of the user performing the creation (for logging).
 * @returns A promise that resolves to the newly created user object.
 */
export const createUser = async (
  userData: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    roleId: string;
  },
  creatorId: string
): Promise<User> => {
  // Destructuring user data
  const { password, roleId } = userData;

  // Hashing the plain text password before storing it
  const hashedPassword = await hashPassword(password);

  // Checking if the role exists
  const role = await findRoleWithPermissionsById(roleId);
  if (!role) {
    // Throwing an error if the specified role does not exist
    throw new CustomError('Invalid role ID provided.', 400);
  }

  // Checking for username or email duplicates (via direct query for faster check before model call)
  const existingUserSql = 'SELECT id FROM users WHERE username = $1 OR email = $2';
  const existingUserRows = await query(existingUserSql, [userData.username, userData.email]);
  if (existingUserRows.length > 0) {
    // Throwing an error if username or email is already in use
    throw new CustomError('Username or email already exists.', 409);
  }

  // Calling the model to insert the new user into the database
  const newUser = await modelCreateUser({
    username: userData.username,
    email: userData.email,
    password_hash: hashedPassword,
    full_name: userData.fullName,
    roleId: userData.roleId,
  });

  // Logging the creation action to the database
  await logService.logAction('USER_CREATED', creatorId, 'User', newUser.id, {
    username: newUser.username,
    role: role.name,
  });

  // Returning the newly created user
  return newUser;
};

/**
 * Creates a new user account.
 * @param userData The user details (username, email, password, fullName, roleId).
 * @param createdByUserId The ID of the user performing the creation (for audit/log).
 * @returns The newly created user object.
 */
export const createUserAccount = async (
  userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'isActive'> & { password: string },
  createdByUserId: string | null
): Promise<User> => {
  //  Validate roleId exists
  const role = await roleModel.findRoleById(userData.roleId);
  if (!role) {
    throw new CustomError('Invalid role ID specified.', 400);
  }

  //  const { password } = userData;

  const roleId = userData.roleId;

   // Hashing the plain text password before storing it
  const password_hash = await hashPassword(userData.password);
  const full_name = userData.fullName;

  //  Create user in model
  const newUser = await modelCreateUser({
      username: userData.username,
      email: userData.email,
      password_hash,
      full_name,
      roleId
  });

  // Log the action (if createdByUserId is present)
  if (createdByUserId) {
      logService.logAction('USER_CREATED_BY_ADMIN', createdByUserId, 'User', newUser.id, { 
          role: role.name 
      });
  } else {
      // Log for self-registration or initial setup
      logService.logAction('USER_REGISTERED', newUser.id, 'User', newUser.id, { 
          role: role.name 
      });
  }

  return newUser;
};

/**
 * Updating an existing user's details.
 * @param id The ID of the user to update.
 * @param updates The fields to update.
 * @param updaterId The ID of the user performing the update (for logging).
 * @returns A promise that resolves to the updated user or null.
 */
export const updateUser = async (
  id: string,
  updates: Partial<{ username: string; email: string; fullName: string; isActive: boolean; roleId: string; password?: string }>,
  updaterId: string
): Promise<User | null> => {
  // Temporary variable to hold the hashed password if provided
  let hashedPassword;
  // Checking if a new password was provided
  if (updates.password) {
    // Hashing the new password
    hashedPassword = await hashPassword(updates.password);
    // Removing the plain text password from the updates object
    delete updates.password;
  }

  // If a new roleId is provided, checking if the role exists
  if (updates.roleId) {
    const role = await findRoleWithPermissionsById(updates.roleId);
    if (!role) {
      // Throwing an error if the specified new role does not exist
      throw new CustomError('Invalid role ID provided for update.', 400);
    }
  }

  // Creating a combined update object including the hashed password
  const combinedUpdates = {
    ...updates,
    ...(hashedPassword && { password: hashedPassword }),
  };

  // Calling the model to execute the update query
  const updatedUser = await modelUpdateUser(id, combinedUpdates);

  // Checking if the user was found and updated
  if (updatedUser) {
    // Logging the update action to the database
    await logService.logAction('USER_UPDATED', updaterId, 'User', id, {
      updates: combinedUpdates,
    });
  }

  // Returning the updated user or null
  return updatedUser;
};