import { query } from '@config/database';

// Defining the structure of a Device Status object
export interface DeviceStatus {
  id: string;
  name: string;
  description: string | null;
  isSystemStatus: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Finding all device statuses.
 * @returns A promise resolving to an array of all device statuses.
 */
export const findAllDeviceStatuses = async (): Promise<DeviceStatus[]> => {
  // Query to select all device statuses
  const sql = `
    SELECT id, name, description, is_system_status AS "isSystemStatus",
           created_at AS "createdAt", updated_at AS "updatedAt"
    FROM device_statuses
    ORDER BY name;
  `;
  // Executing the query
  return query(sql);
};

/**
 * Finding a device status by its unique name.
 * @param name The unique name of the status.
 * @returns A promise resolving to the status object or null.
 */
export const findDeviceStatusByName = async (name: string): Promise<DeviceStatus | null> => {
  // Query to select a status by its name
  const sql = `
    SELECT id, name, description, is_system_status AS "isSystemStatus"
    FROM device_statuses
    WHERE name = $1;
  `;
  // Executing the query
  const rows = await query<DeviceStatus>(sql, [name]);
  // Returning the first row or null
  return rows[0] || null;
};

/**
 * Creating a new device status.
 * @param statusData The data for the new device status.
 * @returns A promise resolving to the newly created status object.
 */
export const createDeviceStatus = async (statusData: {
  name: string;
  description?: string;
}): Promise<DeviceStatus> => {
  // Query to insert a new status and return the inserted row
  const sql = `
    INSERT INTO device_statuses (name, description)
    VALUES ($1, $2)
    RETURNING id, name, description, is_system_status AS "isSystemStatus",
              created_at AS "createdAt", updated_at AS "updatedAt";
  `;
  // Executing the insert query
  const rows = await query<DeviceStatus>(sql, [
    statusData.name,
    statusData.description,
  ]);
  // Returning the newly created status
  return rows[0];
};