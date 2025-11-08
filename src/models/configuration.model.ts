import { query } from '@config/database';

// Defining the structure of a Configuration object
export interface Configuration {
  id: string;
  key: string;
  value: string;
  description: string | null;
  isEditableByAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Finding all configuration settings.
 * @returns A promise resolving to an array of all configurations.
 */
export const findAllConfigurations = async (): Promise<Configuration[]> => {
  // Query to select all fields from the configurations table
  const sql = `
    SELECT id, key, value, description, is_editable_by_admin AS "isEditableByAdmin",
           created_at AS "createdAt", updated_at AS "updatedAt"
    FROM configurations
    ORDER BY key;
  `;
  // Executing the query
  return query(sql);
};

/**
 * Finding a single configuration setting by its key.
 * @param key The unique key of the configuration.
 * @returns A promise resolving to the configuration object or null.
 */
export const findConfigurationByKey = async (key: string): Promise<Configuration | null> => {
  // Query to select a configuration by its unique key
  const sql = `
    SELECT id, key, value, description, is_editable_by_admin AS "isEditableByAdmin",
           created_at AS "createdAt", updated_at AS "updatedAt"
    FROM configurations
    WHERE key = $1;
  `;
  // Executing the query
  const rows = await query<Configuration>(sql, [key]);
  // Returning the first row or null
  return rows[0] || null;
};

/**
 * Updating the value of an existing configuration setting.
 * @param key The unique key of the configuration to update.
 * @param value The new value for the configuration.
 * @returns A promise resolving to the updated configuration object or null.
 */
export const updateConfigurationValue = async (
  key: string,
  value: string
): Promise<Configuration | null> => {
  // Query to update the value of a configuration and return the updated row
  const sql = `
    UPDATE configurations
    SET value = $2
    WHERE key = $1 AND is_editable_by_admin = TRUE
    RETURNING id, key, value, description, is_editable_by_admin AS "isEditableByAdmin",
              created_at AS "createdAt", updated_at AS "updatedAt";
  `;
  // Executing the update query
  const rows = await query<Configuration>(sql, [key, value]);
  // Returning the updated row or null
  return rows[0] || null;
};

/**
 * Creating a new configuration setting (for initial seeding or advanced settings).
 * @param configData The data for the new configuration.
 * @returns A promise resolving to the newly created configuration object.
 */
export const createConfiguration = async (configData: {
  key: string;
  value: string;
  description?: string;
  isEditableByAdmin?: boolean;
}): Promise<Configuration> => {
  // Destructuring and setting defaults
  const { key, value, description = null, isEditableByAdmin = true } = configData;

  // Query to insert a new configuration and return the inserted row
  const sql = `
    INSERT INTO configurations (key, value, description, is_editable_by_admin)
    VALUES ($1, $2, $3, $4)
    RETURNING id, key, value, description, is_editable_by_admin AS "isEditableByAdmin",
              created_at AS "createdAt", updated_at AS "updatedAt";
  `;
  // Executing the insert query
  const rows = await query<Configuration>(sql, [
    key,
    value,
    description,
    isEditableByAdmin,
  ]);
  // Returning the newly created configuration
  return rows[0];
};