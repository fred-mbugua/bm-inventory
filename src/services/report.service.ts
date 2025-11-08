import * as reportModel from '@models/report.model';
import { DailyProfit, StockReport } from '@models/report.model';
import { CustomError } from '@utils/errorHandler';

/**
 * Validating the date format (YYYY-MM-DD).
 * @param dateStr The date string to validate.
 * @returns True if valid, otherwise throws an error.
 */
const validateDateFormat = (dateStr: string) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr) || isNaN(new Date(dateStr).getTime())) {
    throw new CustomError('Invalid date format. Dates must be in YYYY-MM-DD format.', 400);
  }
};

/**
 * Generating the daily profit summary report.
 * @param startDate The start date (YYYY-MM-DD).
 * @param endDate The end date (YYYY-MM-DD).
 * @returns A promise resolving to the daily profit summary.
 */
export const getProfitReport = async (
  startDate: string,
  endDate: string
): Promise<DailyProfit[]> => {
  // 1. Validation
  validateDateFormat(startDate);
  validateDateFormat(endDate);

  // Ensuring start date is not after end date
  if (new Date(startDate) > new Date(endDate)) {
    throw new CustomError('Start date cannot be after the end date.', 400);
  }

  // 2. Delegation to the model
  return reportModel.getDailyProfitSummary(startDate, endDate);
};

/**
 * Generating the current stock summary report.
 * @returns A promise resolving to the current stock summary aggregated by model.
 */
export const getStockReport = async (): Promise<StockReport[]> => {
  // Delegation to the model
  return reportModel.getCurrentStockSummary();
};