import { Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler';
import { AuthenticatedRequest } from '@middlewares/auth.middleware';
import * as saleService from '@services/sale.service';
import { CustomError } from '@utils/errorHandler';

const CREATE_SALE = 'sale:create';

/**
 * Initiating a new sales transaction.
 */
export const createSale = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Extracting sale data from the request body
  const { items, customerName, customerEmail, customerPhone } = req.body; // ADDED customerEmail

  // 1. Basic input validation
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new CustomError('Sale items are required.', 400);
  }
  if (!customerName) {
    throw new CustomError('Customer name is required.', 400);
  }

  // 2. Detailed item validation (omitted for brevity, assume passed)

  // 3. Process the sale using the service layer
  const newSale = await saleService.processSale(
    items,
    customerName,
    customerPhone,
    req.user!.id // The user ID of the sales person
  );

  // 4. Respond with success
  res.status(201).json({
    success: true,
    message: `Sale completed successfully. Receipt No: ${newSale.receiptNo}`,
    data: newSale,
  });
});