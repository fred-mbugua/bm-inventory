import { query } from '@config/database';

// Defining the structure of a Phone Model object
export interface PhoneModel {
  id: string;
  name: string;
  defaultCostPrice: number;
  defaultSellingPrice: number;
  specifications: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Finding all phone models.
 * @returns A promise resolving to an array of all phone models.
 */
export const findAllPhoneModels = async (): Promise<PhoneModel[]> => {
  // Query to select all phone models
  const sql = `
    SELECT id, name, default_cost_price AS "defaultCostPrice",
           default_selling_price AS "defaultSellingPrice", specifications,
           created_at AS "createdAt", updated_at AS "updatedAt"
    FROM phone_models
    ORDER BY name;
  `;
  // Executing the query
  return query(sql);
};

/**
 * Creating a new phone model.
 * @param modelData The data for the new phone model.
 * @returns A promise resolving to the newly created phone model object.
 */
export const createPhoneModel = async (modelData: {
  name: string;
  defaultCostPrice: number;
  defaultSellingPrice: number;
  specifications?: string;
}): Promise<PhoneModel> => {
  // Query to insert a new model and return the inserted row
  const sql = `
    INSERT INTO phone_models (name, default_cost_price, default_selling_price, specifications)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, default_cost_price AS "defaultCostPrice",
              default_selling_price AS "defaultSellingPrice", specifications,
              created_at AS "createdAt", updated_at AS "updatedAt";
  `;
  // Executing the insert query
  const rows = await query<PhoneModel>(sql, [
    modelData.name,
    modelData.defaultCostPrice,
    modelData.defaultSellingPrice,
    modelData.specifications,
  ]);
  // Returning the newly created model
  return rows[0];
};

// ... other necessary model functions (findById, update, delete) will be added as needed.