import { query } from '@config/database';

/**
 * Finding a user's role and all active permissions by user ID.
 * @param userId The ID of the user.
 * @returns A promise resolving to an array of permission names.
 */
export const getUserPermissions = async (userId: string): Promise<string[]> => {
  // Query to join users, roles, role_permissions, and permissions tables
  const sql = `
    SELECT p.name
    FROM users u
    JOIN roles r ON u.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE u.id = $1 AND u.is_active = TRUE;
  `;
  // Executing the query with the user ID
  const rows = await query<{ name: string }>(sql, [userId]);
  // Returning an array of permission names
  return rows.map((row) => row.name);
};