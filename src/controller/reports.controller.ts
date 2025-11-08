import { Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler';
import { AuthenticatedRequest } from '@middlewares/auth.middleware';
import * as reportService from '@services/report.service';
import { CustomError } from '@utils/errorHandler';

// Defining permission for viewing financial/sensitive reports
const VIEW_FINANCIAL_REPORTS = 'report:view_financial';
const VIEW_STOCK_REPORTS = 'report:view_stock';

/**
 * Retrieving the daily profit summary report based on a date range.
 */
export const getProfitReport = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Extracting start and end dates from query parameters
  const { startDate, endDate } = req.query;

  // Basic check for required parameters
  if (!startDate || !endDate) {
    throw new CustomError('Both startDate and endDate query parameters (YYYY-MM-DD) are required.', 400);
  }

  // Calling the service to generate the report
  const reportData = await reportService.getProfitReport(
    startDate as string,
    endDate as string
  );

  // Responding with the report data
  res.status(200).json({
    success: true,
    message: 'Profit report generated successfully.',
    data: reportData,
  });
});

/**
 * Retrieving the current stock summary report.
 */
export const getStockReport = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Calling the service to generate the stock report
  const reportData = await reportService.getStockReport();

  // Responding with the report data
  res.status(200).json({
    success: true,
    message: 'Current stock report generated successfully.',
    data: reportData,
  });
});