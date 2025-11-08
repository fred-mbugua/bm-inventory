import * as statusModel from '@models/deviceStatus.model';
import { DeviceStatus } from '@models/deviceStatus.model';
import { CustomError } from '@utils/errorHandler';
import { logService } from './log.service';

/**
 * Retrieving all device statuses.
 * @returns A promise resolving to an array of all device statuses.
 */
export const getAllDeviceStatuses = async (): Promise<DeviceStatus[]> => {
  // Delegating to the model to fetch all statuses
  return statusModel.findAllDeviceStatuses();
};

/**
 * Creating a new, custom device status.
 * @param name The unique name of the status.
 * @param description The status description.
 * @param creatorId The ID of the user performing the action (for logging).
 * @returns A promise resolving to the newly created status.
 */
export const createDeviceStatus = async (
  name: string,
  description: string | undefined,
  creatorId: string
): Promise<DeviceStatus> => {
  // Checking if a status with the given name already exists
  const existingStatus = await statusModel.findDeviceStatusByName(name);
  if (existingStatus) {
    // Throwing an error if the status name is taken
    throw new CustomError(`Device status '${name}' already exists.`, 400);
  }

  // Calling the model to create the new status
  const newStatus = await statusModel.createDeviceStatus({ name, description });

  // Logging the creation action
  await logService.logAction('DEVICE_STATUS_CREATED', creatorId, 'DeviceStatus', newStatus.id, {
    name: newStatus.name,
  });

  // Returning the new status
  return newStatus;
};

// ... other CRUD services (update and delete status) will be implemented as needed.