import { query } from '@config/database';
import { Role } from './role.model'; // Importing the Role type

// Defining the basic structure of a User object
export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  isActive: boolean;
  roleId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Defining the structure of a User with their Role (without password)
export interface UserWithRole extends User {
  role: {
    id: string;
    name: string;
  };
}

// Defining the structure of a User with their Hashed Password (for login)
export interface UserWithPassword extends User {
  password: string;
}

/**
 * Finding a user by their username or email, including their hashed password and role.
 * Used primarily for the authentication process.
 * @param identifier The username or email of the user.
 * @returns The user object with password and role details, or null if not found.
 */
export const findUserByUsernameOrEmailForAuth = async (identifier: string): Promise<UserWithPassword & { roleName: string } | null> => {
  // Query to select user details, password, and role name
  const sql = `
    SELECT
        u.id, u.username, u.email, u.password_hash AS "password", u.full_name AS "fullName", u.is_active AS "isActive", u.role_id AS "roleId",
        r.name AS "roleName"
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.username = $1 OR u.email = $1;
  `;
  // Executing the query with the identifier (assert the expected row shape)
  const rows = await query(sql, [identifier]) as (UserWithPassword & { roleName: string })[];
  // Returning the first row or null
  return rows[0] ?? null;
};

/**
 * Finding all users with their associated role name.
 * @returns An array of user objects with role details.
 */
export const findAllUsers = async (): Promise<UserWithRole[]> => {
  // Query to select all users and join with the roles table
  const sql = `
    SELECT
        u.id, u.username, u.email, u.full_name AS "fullName", u.is_active AS "isActive",
        u.role_id AS "roleId", u.created_at AS "createdAt", u.updated_at AS "updatedAt",
        r.id AS "role.id", r.name AS "role.name"
    FROM users u
    JOIN roles r ON u.role_id = r.id
    ORDER BY u.created_at DESC;
  `;
  // Executing the query
  const rows = await query(sql);

  // Mapping the flat result set into the structured UserWithRole array
  return rows.map((row: any) => ({
    id: row.id,
    username: row.username,
    email: row.email,
    fullName: row.fullName,
    isActive: row.isActive,
    roleId: row.roleId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    role: {
      id: row['role.id'],
      name: row['role.name'],
    },
  }));
};

/**
 * Finding a single user by their ID.
 * @param id The ID of the user to find.
 * @returns The user object with role details, or null if not found.
 */
export const findUserById = async (id: string): Promise<UserWithRole | null> => {
  // Query to select a single user by ID and join with roles
  const sql = `
    SELECT
        u.id, u.username, u.email, u.full_name AS "fullName", u.is_active AS "isActive",
        u.role_id AS "roleId", u.created_at AS "createdAt", u.updated_at AS "updatedAt",
        r.id AS "role.id", r.name AS "role.name"
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = $1;
  `;
  // Executing the query with the user ID
  const rows = await query(sql, [id]);

  // Checking if a row was returned
  if (rows.length === 0) {
    return null;
  }

  // Mapping the result to the structured UserWithRole object
  const row: any = rows[0];
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    fullName: row.fullName,
    isActive: row.isActive,
    roleId: row.roleId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    role: {
      id: row['role.id'],
      name: row['role.name'],
    },
  };
};

/**
 * Creating a new user in the database.
 * @param userData The user data including hashed password.
 * @returns The newly created user object (excluding password).
 */
export const createUser = async (userData: {
  username: string;
  email: string;
  password_hash: string;
  full_name: string;
  roleId: string;
}): Promise<User> => {
  // Destructuring user data
  const { username, email, password_hash, full_name, roleId } = userData;
  // console.log("User Data: ", userData)
  // Query to insert a new user and return the inserted row
  const sql = `
    INSERT INTO users (username, email, password_hash, full_name, role_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, username, email, full_name AS "fullName", is_active AS "isActive", role_id AS "roleId", created_at AS "createdAt", updated_at AS "updatedAt";
  `;
  // Executing the query (assert the expected row shape)
  const rows = await query(sql, [username, email, password_hash, full_name, roleId]) as User[];
  // Returning the newly created user object
  return rows[0];
};

/**
 * Updating an existing user's details.
 * @param id The ID of the user to update.
 * @param updates The fields to update (excluding password/role change which should be separate).
 * @returns The updated user object, or null if not found.
 */
export const updateUser = async (
  id: string,
  updates: Partial<{ username: string; email: string; fullName: string; isActive: boolean; roleId: string }>
): Promise<User | null> => {
  // Creating arrays for set clauses and parameters
  const setClauses: string[] = [];
  const params: (string | boolean)[] = [];
  let paramIndex = 1;

  // Building the SET clause dynamically based on provided updates
  if (updates.username !== undefined) {
    setClauses.push(`username = $${paramIndex++}`);
    params.push(updates.username);
  }
  if (updates.email !== undefined) {
    setClauses.push(`email = $${paramIndex++}`);
    params.push(updates.email);
  }
  if (updates.fullName !== undefined) {
    setClauses.push(`full_name = $${paramIndex++}`);
    params.push(updates.fullName);
  }
  if (updates.isActive !== undefined) {
    setClauses.push(`is_active = $${paramIndex++}`);
    params.push(updates.isActive);
  }
  if (updates.roleId !== undefined) {
    setClauses.push(`role_id = $${paramIndex++}`);
    params.push(updates.roleId);
  }

  // Returning null if no fields are being updated
  if (setClauses.length === 0) {
    return null;
  }

  // Finalizing parameters by adding the user ID
  params.push(id);
  const userIdParamIndex = paramIndex;

  // Constructing the final SQL query
  const sql = `
    UPDATE users
    SET ${setClauses.join(', ')}
    WHERE id = $${userIdParamIndex}
    RETURNING id, username, email, full_name AS "fullName", is_active AS "isActive", role_id AS "roleId", created_at AS "createdAt", updated_at AS "updatedAt";
  `;
// Executing the update query (asserting result shape)
  const rows = await query(sql, params) as User[];

  // Returning the updated user or null
  return rows[0] ?? null;
};