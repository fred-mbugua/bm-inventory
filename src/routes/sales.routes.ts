import { Router } from 'express';
import { protect, authorize } from '@middlewares/auth.middleware';
import * as saleController from '../controller/sales.controller';

// Creating a new Express router instance
const router = Router();

// Defining permission constants
const CREATE_SALE = 'sale:create';
const VIEW_ALL_SALES = 'sale:view_all';

// Applying protection middleware to all sale routes
router.use(protect);

// POST /api/sales - Create a new sale transaction
router.post('/', authorize([CREATE_SALE]), saleController.createSale);

// GET /api/sales - Get all sales (Requires higher permission)
// router.get('/', authorize([VIEW_ALL_SALES]), saleController.getSales); // To be implemented

// Exporting the router
export default router;