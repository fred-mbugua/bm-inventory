import { Router } from 'express';
import { protect, authorize } from '@middlewares/auth.middleware';
import * as roleController from '@controllers/roles.controller';

// Creating a new Express router instance
const router = Router();

// Defining permission constants
const MANAGE_ROLES = 'role:manage';
const VIEW_PERMISSIONS = 'role:view_permissions';

// Applying protection middleware to all role routes
router.use(protect);

// GET /api/roles/permissions - Get all available permissions (accessible by anyone who can manage roles or is an admin)
router.get('/permissions', authorize([VIEW_PERMISSIONS, MANAGE_ROLES]), roleController.getPermissions);

// GET /api/roles - Get all roles
router.get('/', authorize([MANAGE_ROLES]), roleController.getRoles);

// POST /api/roles - Create a new role
router.post('/', authorize([MANAGE_ROLES]), roleController.createRole);

// GET /api/roles/:id - Get a single role
router.get('/:id', authorize([MANAGE_ROLES]), roleController.getRole);

// PUT /api/roles/:id - Update an existing role
router.put('/:id', authorize([MANAGE_ROLES]), roleController.updateRole);

// DELETE /api/roles/:id - Delete a role
router.delete('/:id', authorize([MANAGE_ROLES]), roleController.deleteRole);

// Exporting the router
export default router;