import { query } from '@config/database';

// Defining the structure for the log payload
export interface LogActionPayload {
  message?: string;
  [key: string]: any; // Allows for any other properties to be stored
}

/**
 * Inserting a single action log entry into the database.
 * @param action The type of action performed (e.g., 'USER_CREATED', 'SALE_COMPLETED').
 * @param userId The ID of the user who performed the action.
 * @param entityType The type of entity involved (e.g., 'User', 'Sale', 'Role').
 * @param entityId The ID of the entity involved (optional).
 * @param payload Additional JSON data/details about the action.
 */
export const createActionLog = async (
  action: string,
  userId: string,
  entityType: string,
  entityId: string | null,
  payload: LogActionPayload
): Promise<void> => {
  // SQL query to insert data into the logs table
  const sql = `
    INSERT INTO logs (action, user_id, entity_type, entity_id, payload)
    VALUES ($1, $2, $3, $4, $5);
  `;
  // Executing the query
  // NOTE: The JSON payload must be passed as a string or a JSON object depending on your driver settings.
  // Assuming the `query` helper handles the JSON conversion correctly.
  await query(sql, [
    action,
    userId,
    entityType,
    entityId,
    payload,
  ]);
};