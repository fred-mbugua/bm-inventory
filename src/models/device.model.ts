import { query, transaction } from '@config/database';

// Defining the structure of a Device object (a single mobile unit)
export interface Device {
  id: string;
  modelId: string;
  imei: string;
  costPrice: number;
  sellingPrice: number;
  statusId: string;
  addedByUserId: string | null;
  assignedToUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Defining the structure for the aggregated stock view
export interface StockSummary {
  modelId: string;
  modelName: string;
  inStockCount: number;
  soldCount: number;
  totalCount: number;
}

/**
 * Inserting a single new device into the inventory.
 * @param deviceData The data for the new device, including IMEI.
 * @returns The newly created device object.
 */
export const createDevice = async (deviceData: {
  modelId: string;
  imei: string;
  costPrice: number;
  sellingPrice: number;
  statusId: string;
  addedByUserId: string;
}): Promise<Device> => {
  // Destructuring device data
  const { modelId, imei, costPrice, sellingPrice, statusId, addedByUserId } = deviceData;

  // Query to insert a single device and return the inserted row
  const sql = `
    INSERT INTO devices (model_id, imei, cost_price, selling_price, status_id, added_by_user_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, model_id AS "modelId", imei, cost_price AS "costPrice", selling_price AS "sellingPrice",
              status_id AS "statusId", added_by_user_id AS "addedByUserId", created_at AS "createdAt", updated_at AS "updatedAt";
  `;
  // Executing the insert query
  const rows = await query<Device>(sql, [
    modelId,
    imei,
    costPrice,
    sellingPrice,
    statusId,
    addedByUserId,
  ]);
  // Returning the newly created device
  return rows[0];
};

/**
 * Finding a device by its unique IMEI number.
 * @param imei The IMEI number to search for.
 * @returns The device object or null.
 */
export const findDeviceByImei = async (imei: string): Promise<Device | null> => {
  // Query to select a device by its IMEI
  const sql = `
    SELECT id, model_id AS "modelId", imei, cost_price AS "costPrice", selling_price AS "sellingPrice",
           status_id AS "statusId", added_by_user_id AS "addedByUserId", created_at AS "createdAt", updated_at AS "updatedAt"
    FROM devices
    WHERE imei = $1;
  `;
  // Executing the query
  const rows = await query<Device>(sql, [imei]);
  // Returning the first row or null
  return rows[0] || null;
};

/**
 * Performing a bulk, transaction-safe insertion of multiple devices (IMIEs).
 * @param devices An array of device data objects.
 * @param addedByUserId The ID of the user performing the bulk addition.
 * @returns A promise resolving to the number of successfully inserted devices.
 */
export const bulkCreateDevices = async (
  devices: Omit<Device, 'id' | 'addedByUserId' | 'createdAt' | 'updatedAt'>[],
  addedByUserId: string
): Promise<number> => {
  // Starting a transaction for atomicity
  return transaction<number>(async (client) => {
    // Preparing the bulk insert values string
    const valuePlaceholders = devices.map((_, index) => {
      // Calculating the starting index for parameters for the current device
      const paramStart = index * 5 + 1;
      // Generating the placeholder string for one device
      return `($${paramStart}, $${paramStart + 1}, $${paramStart + 2}, $${paramStart + 3}, $${paramStart + 4}, $${devices.length * 5 + 1})`;
    }).join(', ');

    // Flattening the device data into a single array of parameters
    const flattenedParams: any[] = devices.flatMap(d => [
      d.modelId,
      d.imei,
      d.costPrice,
      d.sellingPrice,
      d.statusId
    ]);

    // Adding the addedByUserId at the end of the flattened parameters list
    flattenedParams.push(addedByUserId);

    // Constructing the full bulk insert query
    const sql = `
      INSERT INTO devices (model_id, imei, cost_price, selling_price, status_id, added_by_user_id)
      VALUES ${valuePlaceholders}
      ON CONFLICT (imei) DO NOTHING;
    `;
    // Executing the bulk insert query within the transaction
    const result = await client.query(sql, flattenedParams);
    // Returning the number of rows successfully inserted
    return result.rowCount;
  });
};

/**
 * Performs a bulk update to assign a list of devices (by IMEI) to a specific user.
 * @param imeis An array of IMEI strings.
 * @param assignToUserId The ID of the sales user the devices are assigned to (or NULL to unassign).
 * @returns A promise resolving to the number of devices updated.
 */
export const bulkAssignDevices = async (
  imeis: string[],
  assignToUserId: string | null
): Promise<number> => {
  // Creating a placeholder string for the IMEI array parameters
  const placeholders = imeis.map((_, i) => `$${i + 2}`).join(',');

  // SQL query to update the assigned user ID for all matching IMEIs
  const sql = `
    UPDATE devices
    SET assigned_to_user_id = $1
    WHERE imei IN (${placeholders})
    RETURNING id;
  `;
  // Executing the update query
  const result = await query(sql, [assignToUserId, ...imeis]);

  // Returning the count of updated rows
  return result.rowCount;
};

/**
 * Finds all devices currently assigned to a specific sales user.
 * @param userId The ID of the sales user.
 * @returns A promise resolving to an array of Device objects.
 */
export const findDevicesAssignedToUser = async (userId: string): Promise<Device[]> => {
  const sql = `
    SELECT id, model_id AS "modelId", imei, cost_price AS "costPrice", selling_price AS "sellingPrice",
           status_id AS "statusId", added_by_user_id AS "addedByUserId", assigned_to_user_id AS "assignedToUserId",
           created_at AS "createdAt", updated_at AS "updatedAt"
    FROM devices
    WHERE assigned_to_user_id = $1;
  `;
  return query<Device>(sql, [userId]);
};