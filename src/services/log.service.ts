import { logger } from '@config/logger'; // Used for logging errors in the logging process
import * as logModel from '@models/log.model';
import { LogActionPayload } from '@models/log.model';

// Defining the structure for the public Log Service interface
class LogService {
  /**
   * Records a user-initiated action to the database asynchronously.
   * This function does not block the calling function (it is fire-and-forget).
   * @param action The type of action performed (e.g., 'USER_CREATED', 'SALE_COMPLETED').
   * @param userId The ID of the user who performed the action.
   * @param entityType The type of entity involved (e.g., 'User', 'Sale', 'Role').
   * @param entityId The ID of the entity involved (optional, can be null).
   * @param payload Additional JSON data/details about the action.
   */
  public logAction(
    action: string,
    userId: string,
    entityType: string,
    entityId: string | null,
    payload: LogActionPayload = {}
  ): Promise<void> {
    // Returning a Promise that is not awaited by the caller (fire-and-forget)
    return logModel.createActionLog(action, userId, entityType, entityId, payload).catch((error) => {
      // Catching any errors during the logging process to ensure the main transaction is not affected.
      // We log the failure of the logging operation itself.
      logger.error(`FATAL LOGGING ERROR: Failed to log action '${action}' for user ${userId}.`, error);
    });
  }

  // NOTE: Other log related functions (e.g., get logs for a user, clear old logs) would be added here.
}

// Exporting an instance of the LogService for application-wide use
export const logService = new LogService();