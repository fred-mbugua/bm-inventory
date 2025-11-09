import {
  findAllRolesWithPermissions,
  findRoleWithPermissionsById,
  // findRoleByName,
  findAllPermissions,
  RoleWithPermissions,
  Role,
  Permission,
} from '@models/role.model';
import * as roleModel from '@models/role.model';
import { findUsersByRoleId } from '@models/user.model';
import { transaction, query } from '@config/database';
import { CustomError } from '@utils/errorHandler';
import { logService } from './log.service';

/**
 * Retrieving all roles with their associated permissions.
 * @returns A promise that resolves to an array of roles.
 */
export const getAllRolesWithPermissions = async (): Promise<RoleWithPermissions[]> => {
  // Delegating to the model for fetching all roles and permissions
  return findAllRolesWithPermissions();
};

/**
 * Retrieving a single role by ID with its associated permissions.
 * @param id The ID of the role.
 * @returns A promise that resolves to the role or null.
 */
export const getRoleWithPermissionsById = async (id: string): Promise<RoleWithPermissions | null> => {
  // Delegating to the model for fetching a role by ID
  return findRoleWithPermissionsById(id);
};

/**
 * Retrieving all available permissions.
 * @returns A promise that resolves to an array of permissions.
 */
export const getAllPermissions = async (): Promise<Permission[]> => {
  // Delegating to the model for fetching all permissions
  return findAllPermissions();
};

/**
 * Creating a new role and optionally assigning initial permissions.
 * @param name The name of the new role.
 * @param description The description of the new role.
 * @param permissionIds An array of permission IDs to assign.
 * @param userId The ID of the user performing the action (for logging).
 * @returns A promise that resolves to the newly created role.
 */
export const createRole = async (
  name: string,
  description: string,
  permissionIds: string[],
  userId: string
): Promise<Role> => {
  // Starting a database transaction for atomicity
  const newRole = await transaction(async (client) => {
    // Checking if a role with the given name already exists using the client
    const existingRoleRows = await client.query('SELECT id FROM roles WHERE name = $1', [name]);
    if (existingRoleRows.rows.length > 0) {
      // Throwing an error if the role name is taken
      throw new CustomError(`Role name '${name}' already exists.`, 400);
    }

    // Inserting the new role into the roles table
    const createRoleSql = 'INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING *';
    const roleRows = await client.query(createRoleSql, [name, description]);
    const role: Role = roleRows.rows[0];

    // Checking if any permission IDs were provided
    if (permissionIds.length > 0) {
      // Preparing values for bulk insertion into role_permissions
      const permissionValues = permissionIds
        .map((_, index) => `($1, $${index + 2})`)
        .join(', ');

      // Inserting role-permission associations
      const assignPermissionsSql = `
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES ${permissionValues}
        ON CONFLICT (role_id, permission_id) DO NOTHING;
      `;
      // Executing the bulk insert
      await client.query(assignPermissionsSql, [role.id, ...permissionIds]);
    }

    // Returning the newly created role object
    return role;
  });

  // Logging the creation action to the database
  await logService.logAction('ROLE_CREATED', userId, 'Role', newRole.id, {
    name: newRole.name,
    description: newRole.description,
    permissionsAssigned: newRole.permissions.length, // Using the permissions count for logging detail
  });

  // Returning the created role
  return newRole;
};

/**
 * Updating an existing role and its permissions.
 * @param roleId The ID of the role to update.
 * @param name The new name (optional).
 * @param description The new description (optional).
 * @param permissionIds The full list of permission IDs to set for the role.
 * @param userId The ID of the user performing the action (for logging).
 * @returns A promise that resolves to the updated role or null.
 */
export const updateRoleAndPermissions = async (
  roleId: string,
  name: string | undefined,
  description: string | undefined,
  permissionIds: string[],
  userId: string
): Promise<Role | null> => {
  // Starting a database transaction for updating role details and permissions
  const updatedRole = await transaction(async (client) => {
    // Array to hold fields being updated
    const updates: string[] = [];
    // Array to hold parameter values
    const params: (string | undefined)[] = [];
    let paramIndex = 1;

    // Retrieving the current role and its permissions for logging 'before' state
    const oldRoleData = await findRoleWithPermissionsById(roleId);
    if (!oldRoleData) {
      // Throwing an error if the role is not found
      throw new CustomError('Role not found.', 404);
    }

    // Building the update query dynamically
    if (name !== undefined) {
      // Checking if the new name is already taken by another role
      if (name !== oldRoleData.name) {
        const existingRoleRows = await client.query('SELECT id FROM roles WHERE name = $1 AND id != $2', [name, roleId]);
        if (existingRoleRows.rows.length > 0) {
          throw new CustomError(`Role name '${name}' already exists.`, 400);
        }
      }
      // Adding name update to the query
      updates.push(`name = $${paramIndex++}`);
      params.push(name);
    }
    if (description !== undefined) {
      // Adding description update to the query
      updates.push(`description = $${paramIndex++}`);
      params.push(description);
    }

    let role: Role | null = null;
    
    // Updating role metadata if changes are present
    if (updates.length > 0) {
      // Adding role ID to parameters and constructing the final update query
      params.push(roleId);
      const updateRoleSql = `
        UPDATE roles
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, name, description, created_at, updated_at;
      `;
      // Executing the role details update
      const updatedRows = await client.query(updateRoleSql, params);
      role = updatedRows.rows[0];
    } else {
      // If no metadata update, use the existing data
      role = oldRoleData;
    }

    // Permissions management: Deleting all existing permissions first
    const deletePermissionsSql = 'DELETE FROM role_permissions WHERE role_id = $1';
    await client.query(deletePermissionsSql, [roleId]);

    // Checking if new permission IDs are provided
    if (permissionIds.length > 0) {
      // Preparing values for bulk insertion of new permissions
      const permissionValues = permissionIds
        .map((_, index) => `($1, $${index + 2})`)
        .join(', ');

      // Inserting new role-permission associations
      const assignPermissionsSql = `
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES ${permissionValues};
      `;
      // Executing the bulk insert
      await client.query(assignPermissionsSql, [roleId, ...permissionIds]);
    }

    // Defining logging details
    const logDetails = {
      oldName: oldRoleData.name,
      newName: role?.name,
      oldDescription: oldRoleData.description,
      newDescription: role?.description,
      oldPermissions: oldRoleData.permissions.map(p => p.name),
      newPermissions: await client.query(`
        SELECT p.name FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = $1
      `, [roleId]).then(res => res.rows.map((r: any) => r.name)),
    };

    // Logging the update action
    await logService.logAction('ROLE_UPDATED', userId, 'Role', roleId, logDetails);

    // Returning the updated role object
    return role;
  });

  // Returning the updated role
  return updatedRole;
};


/**
 * Deleting a role. Prevents deletion if users are assigned to it.
 * @param roleId The ID of the role to delete.
 * @param userId The ID of the user performing the action (for logging).
 * @returns A promise that resolves to true if deleted, false if not found.
 */
export const deleteRole = async (roleId: string, userId: string): Promise<boolean> => {
  // Starting a database transaction for safe deletion
  const deleted = await transaction(async (client) => {
    // Checking if any users are currently assigned to this role
    const users = await findUsersByRoleId(roleId);
    if (users.length > 0) {
      // Throwing an error if the role is currently in use
      throw new CustomError(
        `Cannot delete role as ${users.length} user(s) are currently assigned to it.`,
        400
      );
    }

    // Deleting the role (this will cascade delete entries in role_permissions)
    const deleteSql = 'DELETE FROM roles WHERE id = $1 RETURNING id, name';
    const result = await client.query(deleteSql, [roleId]);

    // Returning true if a role was deleted
    if (result.rowCount > 0) {
      // Getting the name of the deleted role for logging
      const roleName = result.rows[0].name;

      // Logging the deletion action
      await logService.logAction('ROLE_DELETED', userId, 'Role', roleId, {
        roleName: roleName,
      });
      return true;
    }

    // Returning false if no role was found to delete
    return false;
  });

  // Returning the deletion status
  return deleted;
};


/**
 * Retrieves a role by its unique ID.
 * @param roleId The UUID of the role.
 * @returns A promise resolving to the Role object.
 */
export const findRoleById = async (roleId: string): Promise<Role | undefined> => {
  return roleModel.findRoleById(roleId);
};

/**
 * Retrieves a role by its name.
 * @param name The name of the role (e.g., 'Sales Associate').
 * @returns A promise resolving to the Role object.
 */
export const findRoleByName = async (name: string): Promise<Role | undefined> => {
  return roleModel.findRoleByName(name);
};