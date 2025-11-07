import { Router } from 'express';
import { protect, authorize } from '@middlewares/auth.middleware';
import * as userController from '@controllers/users.controller';

// Creating a new Express router instance
const router = Router();

// Permission required for general user management
const MANAGE_USERS = 'user:manage';

// Applying protection and authorization middleware to all user routes
router.use(protect);
router.use(authorize([MANAGE_USERS]));

// GET /api/users - Get all users
router.get('/', userController.getUsers);

// POST /api/users - Create a new user
router.post('/', userController.createUser);

// GET /api/users/:id - Get a single user
router.get('/:id', userController.getUser);

// PUT /api/users/:id - Update an existing user
router.put('/:id', userController.updateUser);

// Note: Deletion is omitted for now but would follow a similar pattern
// router.delete('/:id', userController.deleteUser);

// Exporting the router
export default router;