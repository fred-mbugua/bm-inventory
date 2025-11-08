import { Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler';
import { AuthenticatedRequest } from '@middlewares/auth.middleware';
import * as deviceService from '@services/device.service';
import { CustomError } from '@utils/errorHandler';

const DEVICE_ASSIGN = 'device:assign';
const MANAGE_INVENTORY = 'inventory:manage';

/**
 * Handling the bulk stock update via IMEI scanning.
 */
export const bulkStockUpdate = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Extracting the array of scanned data from the request body
  const scanDataArray = req.body.scans; // Expecting [{ imei: '123...', modelId: 'uuid' }, ...]

  // Ensuring the scans array is provided and not empty
  if (!scanDataArray || !Array.isArray(scanDataArray) || scanDataArray.length === 0) {
    // Throwing a 400 error for missing or invalid scan data
    throw new CustomError('Scan data array is required.', 400);
  }

  // Calling the service to perform the bulk transaction
  const newDevicesCount = await deviceService.bulkStockUpdateByScanning(scanDataArray, req.user!.id);

  // Responding with the number of devices successfully added
  res.status(201).json({
    success: true,
    message: `${newDevicesCount} new device(s) added to stock.`,
    data: { newDevicesCount },
  });
});

/**
 * Handles the bulk assignment/unassignment of devices (by IMEI) to a sales person.
 */
export const assignDevices = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // imeis is an array of strings, assignToUserId is a UUID string or null
  const { imeis, assignToUserId } = req.body; 

  if (!imeis || !Array.isArray(imeis)) {
    throw new CustomError('IMEIs array is required.', 400);
  }
  // Allow assignToUserId to be null for unassignment

  const updatedCount = await deviceService.assignDevicesToUser(
    imeis,
    assignToUserId || null, // Convert undefined/empty string to null for database
    req.user!.id // Admin/Manager performing the action
  );

  res.status(200).json({
    success: true,
    message: `${updatedCount} device(s) successfully ${assignToUserId ? 'assigned' : 'unassigned'}.`,
    data: { updatedCount },
  });
});

/**
 * Allows a salesperson to view their assigned devices, or an admin to view a specific user's.
 */
export const getAssignedDevicesList = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  let userIdToView = req.user!.id; // Default: view your own devices

  // If the user is an Admin/Manager AND specifies a userId in the query, they can view others' devices
  if (req.query.userId && req.user!.permissions.includes(MANAGE_INVENTORY)) {
    userIdToView = req.query.userId as string;
  }
  
  // If no user ID is found or if a non-admin tries to view another user's list, only show their own
  // The service handles fetching by ID
  const devices = await deviceService.getAssignedDevices(userIdToView);

  res.status(200).json({
    success: true,
    data: devices,
    targetUser: userIdToView,
  });
});

// Note: Other device management controllers (single device update, view) will be added later.