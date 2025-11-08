import { Router } from 'express';
import { protect, authorize } from '@middlewares/auth.middleware';
import * as configController from '../controller/configurations.controller';

// Creating a new Express router instance
const router = Router();

// Defining permission constant
const MANAGE_CONFIG = 'config:manage';

// Applying protection middleware to all configuration routes
router.use(protect);

// GET /api/configurations - Get all configuration settings
router.get('/', authorize([MANAGE_CONFIG]), configController.getConfigurations);

// PUT /api/configurations/:key - Update a specific configuration setting
router.put('/:key', authorize([MANAGE_CONFIG]), configController.updateConfiguration);

// Exporting the router
export default router;