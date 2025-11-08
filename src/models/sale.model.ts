import { transaction, query } from '@config/database';
import { Device } from './device.model';

// Defining the structure for a Sale transaction summary
export interface Sale {
  id: string;
  receiptNo: string;
  saleDate: Date;
  customerName: string;
  customerPhone: string | null;
  totalAmount: number;
  totalProfit: number;
  soldByUserId: string;
  emailSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Defining the structure for an item sold within a sale
export interface SaleItem {
  id: string;
  saleId: string;
  deviceId: string;
  modelNameAtSale: string;
  quantity: number; // Will always be 1 for IMEI-tracked devices
  unitPrice: number;
  costPriceAtSale: number;
  itemProfit: number;
  imeiAtSale: string;
  createdAt: Date;
}

// Defining the input structure for a sale item
export interface SaleItemInput {
  deviceId: string; // The ID of the specific device being sold
  modelName: string;
  salePrice: number;
}

/**
 * Executes a complete sales transaction: creates the sale, creates sale items, and updates device statuses.
 * @param saleData The overall sale information.
 * @param saleItemsInput Array of items sold (device IDs and sale prices).
 * @param soldStatusId The UUID of the 'Sold' device status.
 * @returns The newly created Sale object.
 */
export const createSaleTransaction = async (
  saleData: Omit<Sale, 'id' | 'saleDate' | 'emailSent' | 'createdAt' | 'updatedAt'>,
  saleItemsInput: SaleItemInput[],
  soldStatusId: string
): Promise<Sale> => {
  // Starting a database transaction for atomicity
  const newSale = await transaction<Sale>(async (client) => {
    
    // The user ID of the salesperson initiating the sale
    const salespersonId = saleData.soldByUserId; 
    
    // 1. Fetch all devices to be sold
    const deviceIds = saleItemsInput.map((item) => item.deviceId);
    const placeholders = deviceIds.map((_, i) => `$${i + 1}`).join(',');

    // Query to fetch devices, checking status AND assignment ownership
    const fetchDevicesSql = `
      SELECT d.id, d.imei, d.cost_price, d.selling_price, d.status_id, pm.name AS model_name, d.assigned_to_user_id
      FROM devices d
      JOIN phone_models pm ON d.model_id = pm.id
      WHERE d.id IN (${placeholders}) 
        AND d.status_id != $${deviceIds.length + 1} -- Must not be 'Sold'
        -- New Logic: Must be unassigned OR assigned to the current salesperson
        AND (d.assigned_to_user_id IS NULL OR d.assigned_to_user_id = $${deviceIds.length + 2}); 
    `;
    const devicesToSellResult = await query<{
      id: string;
      imei: string;
      cost_price: number;
      selling_price: number;
      status_id: string;
      model_name: string;
      assigned_to_user_id: string | null;
    }>(fetchDevicesSql, [...deviceIds, soldStatusId, salespersonId]);

    const devicesToSell = devicesToSellResult.rows;

    // Error check: Ensure all requested devices were returned (i.e., they are in stock AND owned by the salesperson)
    if (devicesToSell.length !== deviceIds.length) {
      // Find out which device failed the check for a more specific error
      const fetchedIds = new Set(devicesToSell.map(d => d.id));
      const failedId = deviceIds.find(id => !fetchedIds.has(id));

      if (failedId) {
          // Check if the device is assigned to someone else
          const checkAssignmentSql = `SELECT assigned_to_user_id FROM devices WHERE id = $1`;
          const assignmentCheck = await query<{ assigned_to_user_id: string | null }>(checkAssignmentSql, [failedId]);
          
          if (assignmentCheck.rows.length > 0 && assignmentCheck.rows[0].assigned_to_user_id !== null) {
              throw new Error(`Device ID ${failedId} is assigned to another salesperson and cannot be sold.`);
          }
      }
      
      throw new Error('One or more devices are invalid, already sold, or not assigned to you.');
    }

    // Creating maps for quick lookups and profit calculation
    const deviceMap = new Map<string, DeviceRow>(devicesToSell.map((d) => [d.id, d]));
    const inputMap = new Map(saleItemsInput.map((i) => [i.deviceId, i]));

    let totalSaleAmount = 0;
    let totalProfit = 0;

    // 2. Calculate totals and prepare sale item data
    const saleItemsValues: (string | number)[] = [];
    let saleItemParamIndex = 1;

    for (const item of saleItemsInput) {
      const device = deviceMap.get(item.deviceId);
      if (!device) {
        throw new Error(`Device with id ${item.deviceId} was not found in fetched devices.`);
      }
      const costPrice = device.cost_price;
      const profit = item.salePrice - costPrice;

      totalSaleAmount += item.salePrice;
      totalProfit += profit;

      // Preparing parameters for bulk sale item insert
      saleItemsValues.push(
        `(Ksh ${saleItemParamIndex++}, Ksh ${saleItemParamIndex++}, $${saleItemParamIndex++}, $${saleItemParamIndex++}, $${saleItemParamIndex++}, $${saleItemParamIndex++}, $${saleItemParamIndex++}, $${saleItemParamIndex++})`
      );
    }

    // 3. Insert the main Sale transaction
    const createSaleSql = `
      INSERT INTO sales (receipt_no, customer_name, customer_phone, total_amount, total_profit, sold_by_user_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    // query(...) returns an array of rows; take the first returned sale
    const saleRows = await query<Sale>(createSaleSql, [
      saleData.receiptNo,
      saleData.customerName,
      saleData.customerPhone,
      totalSaleAmount,
      totalProfit,
      saleData.soldByUserId,
    ]);
    const sale = saleRows[0];

    // 4. Insert Sale Items (details of what was sold)
    let itemParams: any[] = [];
    let valuePlaceholders: string[] = [];

    let placeholderCount = 1;
    for (const item of saleItemsInput) {
      const device = deviceMap.get(item.deviceId)!;
      const costPrice = device.cost_price;
      const profit = item.salePrice - costPrice;

      valuePlaceholders.push(`(Ksh ${placeholderCount++}, Ksh ${placeholderCount++}, Ksh ${placeholderCount++}, Ksh ${placeholderCount++}, Ksh ${placeholderCount++}, Ksh ${placeholderCount++}, Ksh ${placeholderCount++}, Ksh ${placeholderCount++})`);

      itemParams.push(
        sale.id, // saleId
        item.deviceId, // deviceId
        device.model_name, // modelNameAtSale
        1, // quantity
        item.salePrice, // unitPrice
        costPrice, // costPriceAtSale
        profit, // itemProfit
        device.imei // imeiAtSale
      );
    }

    const createSaleItemsSql = `
      INSERT INTO sale_items (sale_id, device_id, model_name_at_sale, quantity, unit_price, cost_price_at_sale, item_profit, imei_at_sale)
      VALUES ${valuePlaceholders.join(', ')}
      RETURNING *;
    `;

    await client.query(createSaleItemsSql, itemParams);

    // 5. Update Device Status (Mark devices as 'Sold')
    const updateDevicesSql = `
      UPDATE devices
      SET status_id = $1
      WHERE id IN (${placeholders});
    `;
    await client.query(updateDevicesSql, [soldStatusId, ...deviceIds]);

    // 6. Return the main Sale object
    return sale;
  });

  // Returning the newly created sale
  return newSale;
};

// ... other sale-related models (e.g., getSaleDetails, generateReceiptNo) to be added