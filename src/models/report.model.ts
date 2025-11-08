import { query } from '@config/database';

// Defining the structure for the aggregated profit report
export interface DailyProfit {
  saleDate: string; // YYYY-MM-DD
  totalSales: number;
  totalCost: number;
  netProfit: number;
  transactionCount: number;
}

// Defining the structure for the aggregated stock report
export interface StockReport {
  modelId: string;
  modelName: string;
  inStockCount: number;
  totalCostValue: number;
  latestCostPrice: number;
  latestSellingPrice: number;
}

/**
 * Generates a summary of daily sales and profit over a specified date range.
 * @param startDate The start date (YYYY-MM-DD).
 * @param endDate The end date (YYYY-MM-DD).
 * @returns A promise resolving to an array of daily profit records.
 */
export const getDailyProfitSummary = async (
  startDate: string,
  endDate: string
): Promise<DailyProfit[]> => {
  // Query to aggregate sales data by day
  const sql = `
    SELECT
        DATE(sale_date) AS "saleDate",
        SUM(total_amount) AS "totalSales",
        SUM(total_amount - total_profit) AS "totalCost",
        SUM(total_profit) AS "netProfit",
        COUNT(id) AS "transactionCount"
    FROM sales
    WHERE sale_date >= $1 AND sale_date <= $2
    GROUP BY DATE(sale_date)
    ORDER BY "saleDate" DESC;
  `;
  // Executing the query with date range parameters
  const rows = await query<DailyProfit>(sql, [startDate, endDate]);

  // Converting numeric strings from SUM/COUNT aggregation back to proper numbers
  return rows.map(row => ({
      ...row,
      totalSales: parseFloat(row.totalSales as any as string),
      totalCost: parseFloat(row.totalCost as any as string),
      netProfit: parseFloat(row.netProfit as any as string),
      transactionCount: parseInt(row.transactionCount as any as string, 10),
  }));
};

/**
 * Generates a summary of the current stock levels aggregated by phone model.
 * @returns A promise resolving to an array of stock report records.
 */
export const getCurrentStockSummary = async (): Promise<StockReport[]> => {
  // Query to get the ID for the 'In-Stock' status
  const inStockStatusSql = `SELECT id FROM device_statuses WHERE name = 'In-Stock'`;
  const statusRows = await query<{ id: string }>(inStockStatusSql);
  const inStockStatusId = statusRows[0]?.id;

  if (!inStockStatusId) {
    // If the system status is missing, return an empty array or throw an error
    return [];
  }

  // Query to group devices by model and calculate current stock, value, and latest prices
  const sql = `
    WITH ModelDevices AS (
        SELECT
            d.model_id,
            d.cost_price,
            d.selling_price,
            ROW_NUMBER() OVER(PARTITION BY d.model_id ORDER BY d.created_at DESC) as rn
        FROM devices d
    )
    SELECT
        pm.id AS "modelId",
        pm.name AS "modelName",
        COUNT(d.id) AS "inStockCount",
        COALESCE(SUM(d.cost_price), 0) AS "totalCostValue",
        MAX(CASE WHEN md.rn = 1 THEN md.cost_price ELSE 0 END) AS "latestCostPrice",
        MAX(CASE WHEN md.rn = 1 THEN md.selling_price ELSE 0 END) AS "latestSellingPrice"
    FROM phone_models pm
    LEFT JOIN devices d ON pm.id = d.model_id AND d.status_id = $1
    LEFT JOIN ModelDevices md ON pm.id = md.model_id
    GROUP BY pm.id, pm.name
    ORDER BY pm.name;
  `;
  // Executing the query with the 'In-Stock' status ID
  const rows = await query<StockReport>(sql, [inStockStatusId]);

  // Converting numeric strings from aggregation back to proper numbers
  return rows.map(row => ({
      ...row,
      inStockCount: parseInt(row.inStockCount as any as string, 10),
      totalCostValue: parseFloat(row.totalCostValue as any as string),
      latestCostPrice: parseFloat(row.latestCostPrice as any as string),
      latestSellingPrice: parseFloat(row.latestSellingPrice as any as string),
  }));
};