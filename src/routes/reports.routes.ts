import { Router } from 'express';
import { protect, authorize } from '@middlewares/auth.middleware';
import * as reportController from '../controller/reports.controller';

// Creating a new Express router instance
const router = Router();

// Defining permission constants
const VIEW_FINANCIAL_REPORTS = 'report:view_financial';
const VIEW_STOCK_REPORTS = 'report:view_stock';

// Applying protection middleware to all report routes
router.use(protect);

// GET /api/reports/profit - Get daily profit summary (Sensitive data)
router.get('/profit', authorize([VIEW_FINANCIAL_REPORTS]), reportController.getProfitReport);

// GET /api/reports/stock - Get current stock summary
router.get('/stock', authorize([VIEW_STOCK_REPORTS, VIEW_FINANCIAL_REPORTS]), reportController.getStockReport);

// Exporting the router
export default router;