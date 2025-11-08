import * as saleModel from '@models/sale.model';
import * as deviceStatusModel from '@models/deviceStatus.model';
import { Sale, SaleItemInput } from '@models/sale.model';
import { CustomError } from '@utils/errorHandler';
import { logService } from './log.service';
import * as mailService from './mail.service';
import { transaction, query } from '@config/database';
import { configurationService } from './configuration.service';

/**
 * Generating a unique, sequential receipt number (e.g., #0001, #0002).
 * NOTE: In a real-world high-volume application, this should use a sequence and lock
 * for concurrency safety, but this implementation is simpler for demonstration.
 * @returns A promise resolving to the next unique receipt number string.
 */
const generateReceiptNumber = async (): Promise<string> => {
  // Query to find the highest existing receipt number
  const sql = `SELECT receipt_no FROM sales ORDER BY created_at DESC LIMIT 1`;
  const rows = (await query(sql)) as { receipt_no: string }[];
  
  // Checking if any sales exist
  if (!Array.isArray(rows) || rows.length === 0) {
    // Starting number is 1
    return '#0001';
  }

  // Extracting the number part and incrementing
  const lastReceiptNo = rows[0].receipt_no; // e.g., "#0042"
  const currentNumber = parseInt(lastReceiptNo.replace('#', ''), 10);
  const nextNumber = currentNumber + 1;

  // Formatting the new receipt number (e.g., padding with zeros)
  return `#${nextNumber.toString().padStart(4, '0')}`;
};

// /**
//  * Processing a complete sales transaction.
//  * @param saleItems Array of items being sold.
//  * @param customerName Customer's name.
//  * @param customerPhone Customer's phone number.
//  * @param soldByUserId The ID of the sales user.
//  * @returns The newly created Sale object.
//  */
// export const processSale = async (
//   saleItems: saleModel.SaleItemInput[],
//   customerName: string,
//   customerPhone: string | undefined,
//   soldByUserId: string
// ): Promise<Sale> => {
//   // 1. Generate the unique receipt number
//   const receiptNo = await generateReceiptNumber();

//   // 2. Get the 'Sold' device status ID
//   const soldStatus = await deviceStatusModel.findDeviceStatusByName('Sold');
//   if (!soldStatus) {
//     // Throwing an error if the system status 'Sold' is missing
//     throw new CustomError('System status "Sold" is not configured. Cannot complete sale.', 500);
//   }
//   const soldStatusId = soldStatus.id;

//   // 3. Prepare the main sale data
//   const saleData = {
//     receiptNo,
//     customerName,
//     customerPhone: customerPhone || null,
//     totalAmount: 0, // Calculated in the model transaction
//     totalProfit: 0, // Calculated in the model transaction
//     soldByUserId,
//   };

//   // 4. Execute the atomic transaction
//   const newSale = await saleModel.createSaleTransaction(saleData, saleItems, soldStatusId);

//   // 5. Trigger the log and email (Email logic handled by Mail Service later)
//   await logService.logAction('SALE_COMPLETED', soldByUserId, 'Sale', newSale.id, {
//     receiptNo: newSale.receiptNo,
//     totalAmount: newSale.totalAmount,
//     itemsCount: saleItems.length,
//   });

//   // NOTE: Future step will involve:
//   // mailService.sendReceipt(newSale.id, customerEmail);

//   // Returning the newly created sale
//   return newSale;
// };


/**
 * Processing a complete sales transaction.
 * @param saleItems Array of items being sold.
 * @param customerName Customer's name.
 * @param customerEmail Customer's email address (optional for receipt).
 * @param customerPhone Customer's phone number.
 * @param soldByUserId The ID of the sales user.
 * @returns The newly created Sale object.
 */
export const processSale = async (
  saleItems: saleModel.SaleItemInput[],
  customerName: string,
  customerEmail: string | undefined, // ADDED EMAIL
  customerPhone: string | undefined,
  soldByUserId: string
): Promise<Sale> => {
  // 1. Generate the unique receipt number
  const receiptNo = await generateReceiptNumber();

  // 2. Get the 'Sold' device status ID
  const soldStatus = await deviceStatusModel.findDeviceStatusByName('Sold');
  if (!soldStatus) {
    throw new CustomError('System status "Sold" is not configured. Cannot complete sale.', 500);
  }
  const soldStatusId = soldStatus.id;

  // 3. Prepare the main sale data
  const saleData = {
    receiptNo,
    customerName,
    customerPhone: customerPhone || null,
    totalAmount: 0, 
    totalProfit: 0, 
    soldByUserId,
  };

  // 4. Execute the atomic transaction
  const newSale = await saleModel.createSaleTransaction(saleData, saleItems, soldStatusId);

  // 5. Trigger the log and email (Asynchronous task)
  await logService.logAction('SALE_COMPLETED', soldByUserId, 'Sale', newSale.id, {
    receiptNo: newSale.receiptNo,
    totalAmount: newSale.totalAmount,
    itemsCount: saleItems.length,
  });

  // --- EMAIL INTEGRATION ---
  if (customerEmail) {
    // DO NOT await this call; let it run in the background to avoid delaying the HTTP response.
    // If the email fails, the main sale transaction is still successful.
    mailService.sendReceipt(newSale.id, customerEmail)
        .catch(error => {
            logger.error(`Background receipt email failed for Sale ${newSale.id}:`, error);
        });
  }
  // -------------------------

  // Returning the newly created sale
  return newSale;
};

// ... other sale services (e.g., getSaleDetails, getProfitReport) to be added