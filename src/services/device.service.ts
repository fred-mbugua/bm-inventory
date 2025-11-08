import * as deviceModel from '@models/device.model';
import * as phoneModel from '@models/phoneModel.model';
import * as deviceStatusModel from '@models/deviceStatus.model';
import { Device } from '@models/device.model';
import { CustomError } from '@utils/errorHandler';
import { logService } from './log.service';

// Interface for the data received from the scanning process
export interface ScanData {
  imei: string;
  modelId: string;
}

/**
 * Performing a bulk, fast stock update by scanning multiple IMEIs.
 * This is designed for the admin 'Add Stock' option.
 * @param scanDataArray An array of scanned IMEIs with their associated model ID.
 * @param userId The ID of the admin/user performing the action.
 * @returns A promise resolving to the count of new devices added.
 */
export const bulkStockUpdateByScanning = async (
  scanDataArray: ScanData[],
  userId: string
): Promise<number> => {
  // Checking for duplicates within the scanned array to provide immediate feedback
  const scannedImeis = scanDataArray.map(d => d.imei);
  const uniqueImeis = new Set(scannedImeis);

  // Throwing an error if the user scanned the same IMEI twice in one session
  if (uniqueImeis.size !== scannedImeis.length) {
    throw new CustomError('Duplicate IMEIs detected in the scanned list. Please review and rescan.', 400);
  }

  // 1. Fetching essential data concurrently: 'In-Stock' status ID and Model data
  const [inStockStatus, models] = await Promise.all([
    deviceStatusModel.findDeviceStatusByName('In-Stock'),
    phoneModel.findAllPhoneModels(),
  ]);

  // Throwing an error if the system status 'In-Stock' is missing
  if (!inStockStatus) {
    throw new CustomError('System status "In-Stock" is not configured. Contact support.', 500);
  }

  // Creating a map for quick model lookup
  const modelMap = new Map(models.map(m => [m.id, m]));

  // 2. Preparing devices for bulk insertion
  const devicesToInsert = scanDataArray.map(scanData => {
    // Finding the model details
    const model = modelMap.get(scanData.modelId);

    // Throwing an error if a model ID in the scan data is invalid
    if (!model) {
      throw new CustomError(`Phone Model ID ${scanData.modelId} not found.`, 400);
    }

    // Returning the structured device object for the model function
    return {
      modelId: model.id,
      imei: scanData.imei,
      costPrice: model.defaultCostPrice,
      sellingPrice: model.defaultSellingPrice,
      statusId: inStockStatus.id,
    };
  });

  // 3. Executing the bulk creation
  const insertedCount = await deviceModel.bulkCreateDevices(devicesToInsert, userId);

  // 4. Logging the action
  await logService.logAction('BULK_STOCK_ADDED', userId, 'Device', null, {
    totalScanned: scanDataArray.length,
    totalAdded: insertedCount,
    reason: 'Initial stock addition via fast scanning.',
    modelCount: uniqueImeis.size,
  });

  // Returning the count of newly added (non-duplicate) devices
  return insertedCount;
};

/**
 * Assigns or unassigns a bulk list of devices (by IMEI) to a sales person.
 * @param imeis Array of IMEI strings to assign.
 * @param assignToUserId The ID of the user to assign the devices to (null to unassign).
 * @param performingUserId The ID of the administrator/manager performing the action (for logging).
 * @returns A promise resolving to the number of devices updated.
 */
export const assignDevicesToUser = async (
  imeis: string[],
  assignToUserId: string | null,
  performingUserId: string
): Promise<number> => {
  // Input validation
  if (!imeis || imeis.length === 0) {
    throw new CustomError('IMEI list cannot be empty.', 400);
  }

  // Execute the bulk update in the model
  const updatedCount = await deviceModel.bulkAssignDevices(imeis, assignToUserId);

  // Logging the action
  const action = assignToUserId ? 'DEVICE_ASSIGNED' : 'DEVICE_UNASSIGNED';
  const assignedTo = assignToUserId || 'Unassigned';

  logService.logAction(action, performingUserId, 'Device', null, {
    count: updatedCount,
    assignedTo: assignedTo,
    imeis: imeis,
  });

  return updatedCount;
};

/**
 * Retrieves devices assigned to a specific sales user.
 * @param userId The ID of the sales user.
 * @returns A promise resolving to an array of assigned devices.
 */
export const getAssignedDevices = async (userId: string): Promise<deviceModel.Device[]> => {
    // Relying on the model to fetch devices assigned to this specific user
    return deviceModel.findDevicesAssignedToUser(userId);
};