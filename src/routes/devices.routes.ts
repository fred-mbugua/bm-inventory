import { Router } from 'express';
import { protect, authorize } from '@middlewares/auth.middleware';
import * as deviceController from '../controller/devices.controller';

// Creating a new Express router instance
const router = Router();

// Permission for admin to add stock/manage inventory
const MANAGE_INVENTORY = 'inventory:manage';
// Permission for general device viewing (admin/sales)
const VIEW_DEVICES = 'device:view';
const DEVICE_ASSIGN = 'device:assign';

// Applying protection middleware to all device routes
router.use(protect);

// POST /api/devices/bulk-stock-update - Endpoint for the fast IMEI scanning process (Admin only)
router.post('/bulk-stock-update', authorize([MANAGE_INVENTORY]), deviceController.bulkStockUpdate);

// POST /api/devices/assign - Endpoint for bulk device assignment/unassignment
router.post('/assign', authorize([DEVICE_ASSIGN]), deviceController.assignDevices);

// GET /api/devices/assigned - Endpoint for viewing assigned devices
// Access control logic is primarily handled in the controller:
// 1. Salesperson (VIEW_DEVICES): Sees only their own.
// 2. Manager/Admin (MANAGE_INVENTORY): Can see others' lists via query param.
router.get('/assigned', authorize([VIEW_DEVICES]), deviceController.getAssignedDevicesList);

// GET /api/devices/inventory-summary - (To be implemented later)

// Exporting the router
export default router;