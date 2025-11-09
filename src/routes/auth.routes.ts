import { Router } from 'express';
import { login, refresh, logout } from '../controller';
import * as authController from '../controller/auth.controller';
import { protect } from '@middlewares/auth.middleware';

// Creating a new Express router instance
const router = Router();

// POST /api/auth/register - Register a new user
router.post('/register', authController.registerUser);

// POST /api/auth/login - Endpoint for user login
router.post('/login', login);

// POST /api/auth/refresh - Endpoint for refreshing access token using refresh token
router.post('/refresh', refresh);

// POST /api/auth/logout - Endpoint for logging out (clearing cookies)
router.post('/logout', protect, logout); // Protecting logout ensures only authenticated users can clear their own cookies

// Exporting the router
export default router;