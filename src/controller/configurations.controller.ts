import { Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler';
import { AuthenticatedRequest } from '@middlewares/auth.middleware';
import { configurationService } from '@services/configuration.service';
import { CustomError } from '@utils/errorHandler';

// Defining permission names
const MANAGE_CONFIG = 'config:manage';

/**
 * Getting all configurable application settings.
 */
export const getConfigurations = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Calling the service to fetch all configurations
  const configurations = await configurationService.getAllConfigurations();
  // Responding with the list of configurations
  res.status(200).json({ success: true, data: configurations });
});

/**
 * Updating a single configuration setting value.
 */
export const updateConfiguration = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Extracting the configuration key from request parameters
  const { key } = req.params;
  // Extracting the new value from the request body
  const { value } = req.body;

  // Ensuring the new value is provided
  if (value === undefined || value === null) {
    // Throwing a 400 error for missing value
    throw new CustomError('Configuration value is required.', 400);
  }

  // Calling the service to update the configuration
  const updatedConfig = await configurationService.updateConfiguration(
    key,
    value,
    req.user!.id // Passing the ID of the user performing the update
  );

  // Responding with the updated configuration data
  res.status(200).json({ success: true, message: `Configuration '${key}' updated.`, data: updatedConfig });
});