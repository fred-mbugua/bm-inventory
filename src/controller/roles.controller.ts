import { Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler';
import { AuthenticatedRequest } from '@middlewares/auth.middleware';
import * as roleService from '@services/role.service';
import { CustomError } from '@utils/errorHandler';

// Defining permission names
const MANAGE_ROLES = 'role:manage';
const VIEW_PERMISSIONS = 'role:view_permissions';

/**
 * Getting all roles with their associated permissions.
 */
export const getRoles = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Calling the service to fetch all roles
  const roles = await roleService.getAllRolesWithPermissions();
  // Responding with the list of roles
  res.status(200).json({ success: true, data: roles });
});

/**
 * Getting a single role by ID.
 */
export const getRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Extracting role ID from request parameters
  const { id } = req.params;
  // Calling the service to fetch a single role
  const role = await roleService.getRoleWithPermissionsById(id);

  // Checking if the role was found
  if (!role) {
    // Throwing a 404 error if role not found
    throw new CustomError(`Role with ID ${id} not found.`, 404);
  }

  // Responding with the role data
  res.status(200).json({ success: true, data: role });
});

/**
 * Getting all available permissions.
 */
export const getPermissions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Calling the service to fetch all permissions
  const permissions = await roleService.getAllPermissions();
  // Responding with the list of permissions
  res.status(200).json({ success: true, data: permissions });
});

/**
 * Creating a new role.
 */
export const createRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Extracting role details from the request body
  const { name, description, permissionIds } = req.body;
  // Ensuring required fields are present
  if (!name || !permissionIds) {
    // Throwing a 400 error for missing required fields
    throw new CustomError('Role name and permission IDs are required.', 400);
  }

  // Calling the service to create the new role
  const newRole = await roleService.createRole(
    name,
    description || '',
    permissionIds,
    req.user!.id
  );

  // Responding with the newly created role
  res.status(201).json({ success: true, message: 'Role created successfully.', data: newRole });
});

/**
 * Updating an existing role and its permissions.
 */
export const updateRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Extracting role ID from request parameters
  const { id } = req.params;
  // Extracting updates from the request body
  const { name, description, permissionIds } = req.body;

  // Ensuring permission IDs (the full list) are provided for update
  if (!permissionIds || !Array.isArray(permissionIds)) {
    // Throwing a 400 error if permission list is missing or invalid
    throw new CustomError('A full list of permission IDs is required for role update.', 400);
  }

  // Calling the service to update the role and permissions
  const updatedRole = await roleService.updateRoleAndPermissions(
    id,
    name,
    description,
    permissionIds,
    req.user!.id
  );

  // Checking if the role was found and updated
  if (!updatedRole) {
    // Throwing a 404 error if role not found
    throw new CustomError(`Role with ID ${id} not found.`, 404);
  }

  // Responding with the updated role data
  res.status(200).json({ success: true, message: 'Role updated successfully.', data: updatedRole });
});

/**
 * Deleting a role.
 */
export const deleteRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Extracting role ID from request parameters
  const { id } = req.params;

  // Calling the service to delete the role
  await roleService.deleteRole(id, req.user!.id);

  // Responding with a success message
  res.status(200).json({ success: true, message: 'Role deleted successfully.' });
});