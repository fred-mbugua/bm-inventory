import { Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler';
import { AuthenticatedRequest } from '@middlewares/auth.middleware';
import * as modelService from '@services/phoneModel.service';
import { CustomError } from '@utils/errorHandler';

const MANAGE_INVENTORY = 'inventory:manage';

/**
 * Getting all phone models.
 */
export const getPhoneModels = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Calling the service to fetch all phone models
  const models = await modelService.getAllPhoneModels();
  // Responding with the list of models
  res.status(200).json({ success: true, data: models });
});

/**
 * Creating a new phone model.
 */
export const createPhoneModel = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Extracting model data from the request body
  const { name, defaultCostPrice, defaultSellingPrice, specifications } = req.body;

  // Ensuring required fields are present
  if (!name || defaultCostPrice === undefined || defaultSellingPrice === undefined) {
    // Throwing a 400 error for missing required fields
    throw new CustomError('Model name, cost price, and selling price are required.', 400);
  }

  // Calling the service to create the new model
  const newModel = await modelService.createPhoneModel(
    { name, defaultCostPrice, defaultSellingPrice, specifications },
    req.user!.id
  );

  // Responding with the newly created model
  res.status(201).json({ success: true, message: 'Phone model created.', data: newModel });
});