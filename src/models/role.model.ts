import { query } from '@config/database';
import { CustomError } from '@utils/errorHandler';

// Defining the structure of a Role object
export interface Role {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

// Defining the structure of a Permission object
export interface Permission {
  id: string;
  name: string;
  description: string;
}

// Defining the structure of a Role with its associated permissions
export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

/**
 * Finding all roles and their associated permissions.
 * @returns An array of roles, each containing a list of permissions.
 */
export const findAllRolesWithPermissions = async (): Promise<RoleWithPermissions[]> => {
  // Selecting roles and joining with permissions through the junction table
  const sql = `
    SELECT
        r.id AS role_id, r.name AS role_name, r.description AS role_description,
        p.id AS permission_id, p.name AS permission_name, p.description AS permission_description
    FROM roles r
    LEFT JOIN role_permissions rp ON r.id = rp.role_id
    LEFT JOIN permissions p ON rp.permission_id = p.id
    ORDER BY r.name, p.name;
  `;
  // Executing the query
  const rows = await query(sql);

  // Grouping the flat result set into a structured array
  const rolesMap = new Map<string, RoleWithPermissions>();

  // Iterating through the query results
  rows.forEach((row: any) => {
    // Checking if the role has been added to the map
    if (!rolesMap.has(row.role_id)) {
      // Creating a new role object if it does not exist
      rolesMap.set(row.role_id, {
        id: row.role_id,
        name: row.role_name,
        description: row.role_description,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        permissions: [],
      });
    }
    // Getting the role object from the map
    const role = rolesMap.get(row.role_id)!;
    // Checking if a permission exists for the current row
    if (row.permission_id) {
      // Adding the permission to the role's permissions array
      role.permissions.push({
        id: row.permission_id,
        name: row.permission_name,
        description: row.permission_description,
      });
    }
  });

  // Returning the array of structured role objects
  return Array.from(rolesMap.values());
};

/**
 * Finding a single role by its ID along with its permissions.
 * @param id The ID of the role to find.
 * @returns The role object with permissions, or null if not found.
 */
export const findRoleWithPermissionsById = async (id: string): Promise<RoleWithPermissions | null> => {
  // Query to select role details and associated permissions
  const sql = `
    SELECT
        r.id AS role_id, r.name AS role_name, r.description AS role_description, r.created_at, r.updated_at,
        p.id AS permission_id, p.name AS permission_name, p.description AS permission_description
    FROM roles r
    LEFT JOIN role_permissions rp ON r.id = rp.role_id
    LEFT JOIN permissions p ON rp.permission_id = p.id
    WHERE r.id = $1
    ORDER BY p.name;
  `;
  // Executing the query with the role ID
  const rows = await query(sql, [id]);

  // Returning null if no rows are found
  if (rows.length === 0) {
    return null;
  }

  // Initializing the role object from the first row
  const firstRow: any = rows[0];
  const role: RoleWithPermissions = {
    id: firstRow.role_id,
    name: firstRow.role_name,
    description: firstRow.role_description,
    createdAt: firstRow.created_at,
    updatedAt: firstRow.updated_at,
    permissions: [],
  };

  // Iterating through rows to aggregate permissions
  rows.forEach((row: any) => {
    // Checking if a permission exists for the current row
    if (row.permission_id) {
      // Adding the permission to the role's permissions array
      role.permissions.push({
        id: row.permission_id,
        name: row.permission_name,
        description: row.permission_description,
      });
    }
  });

  // Returning the structured role object
  return role;
};

/**
 * Finding a single role by its name.
 * @param name The name of the role to find.
 * @returns The role object, or null if not found.
 */
export const findRoleByName = async (name: string): Promise<Role | null> => {
  // Query to select specific fields for a role by its unique name
  const sql = 'SELECT id, name, description, created_at, updated_at FROM roles WHERE name = $1';
  // Executing the query
  const rows = await query(sql, [name]);
  // Returning mapped Role object or null
  if (rows.length === 0) {
    return null;
  }
  const r: any = rows[0];
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    createdAt: new Date(r.created_at || r.createdAt),
    updatedAt: new Date(r.updated_at || r.updatedAt),
  };
};

/**
 * Finding all available permissions.
 * @returns An array of all permissions.
 */
export const findAllPermissions = async (): Promise<Permission[]> => {
  // Query to select all permissions
  const sql = 'SELECT id, name, description FROM permissions ORDER BY name';
  // Executing the query and returning results
  return query(sql);
};

// ... other role manipulation functions (createRole, updateRole, deleteRole, updateRolePermissions) will be implemented in the service layer using the transaction helper.