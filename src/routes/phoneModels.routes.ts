import { Router } from 'express';
import { protect, authorize } from '@middlewares/auth.middleware';
import * as modelController from '../controller/phoneModels.controller';

// Creating a new Express router instance
const router = Router();

const MANAGE_INVENTORY = 'inventory:manage';

// Applying protection middleware to all model routes
router.use(protect);

// GET /api/phone-models - Get all phone models (Needed by sales/admin for stock view/adding)
router.get('/', authorize(['device:view', 'sale:create']), modelController.getPhoneModels);

// POST /api/phone-models - Create a new phone model (Admin only)
router.post('/', authorize([MANAGE_INVENTORY]), modelController.createPhoneModel);

// Exporting the router
export default router;