import * as modelModel from '@models/phoneModel.model';
import { PhoneModel } from '@models/phoneModel.model';
import { CustomError } from '@utils/errorHandler';
import { logService } from './log.service';

/**
 * Retrieving all phone models.
 * @returns A promise resolving to an array of all phone models.
 */
export const getAllPhoneModels = async (): Promise<PhoneModel[]> => {
  // Delegating to the model to fetch all models
  return modelModel.findAllPhoneModels();
};

/**
 * Creating a new phone model.
 * @param modelData The data for the new model.
 * @param creatorId The ID of the user performing the action (for logging).
 * @returns A promise resolving to the newly created model.
 */
export const createPhoneModel = async (
  modelData: {
    name: string;
    defaultCostPrice: number;
    defaultSellingPrice: number;
    specifications?: string;
  },
  creatorId: string
): Promise<PhoneModel> => {
  // Simple check for name uniqueness (more robust check would be in the model if not unique constraint)
  const existingModels = await modelModel.findAllPhoneModels();
  if (existingModels.some(m => m.name.toLowerCase() === modelData.name.toLowerCase())) {
    // Throwing an error if the model name is taken
    throw new CustomError(`Phone model '${modelData.name}' already exists.`, 400);
  }

  // Calling the model to create the new model
  const newModel = await modelModel.createPhoneModel(modelData);

  // Logging the creation action
  await logService.logAction('PHONE_MODEL_CREATED', creatorId, 'PhoneModel', newModel.id, {
    name: newModel.name,
  });

  // Returning the new model
  return newModel;
};

// ... other CRUD services (update, delete model) will be implemented as needed.