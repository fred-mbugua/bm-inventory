import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { logger } from './config/logger';
import errorHandler from './utils/errorHandler'; // Global error handler middleware
import { API_PREFIX } from './config/constants'; // Assuming API_PREFIX = '/api'
import { COOKIE_SECRET } from './config/jwt'; // The secret key for signing cookies

// Import all routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/users.routes';
import roleRoutes from './routes/roles.routes';
import configRoutes from './routes/configurations.routes';
import modelRoutes from './routes/phoneModels.routes';
import deviceRoutes from './routes/devices.routes';
import saleRoutes from './routes/sales.routes';

// Creating the Express application instance
const app = express();

// --- Middleware Setup ---
// Security Middleware
app.use(helmet());

// CORS (Configure appropriately for production)
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000', // Allow requests from your frontend
    credentials: true, // Allow cookies to be sent
}));

// Body Parsers
app.use(express.json()); // To parse application/json
app.use(express.urlencoded({ extended: true })); // To parse application/x-www-form-urlencoded

// Cookie Parser
app.use(cookieParser(COOKIE_SECRET)); // Use the same secret for signed cookies

// Health Check Route
app.get(API_PREFIX, (req, res) => {
    res.status(200).json({ message: 'POS API is running!' });
});

// --- Route Mounting ---
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/roles`, roleRoutes);
app.use(`${API_PREFIX}/configurations`, configRoutes);
app.use(`${API_PREFIX}/phone-models`, modelRoutes);
app.use(`${API_PREFIX}/devices`, deviceRoutes);
app.use(`${API_PREFIX}/sales`, saleRoutes);

// --- Final Error Handler ---
// Must be the last middleware
app.use(errorHandler);

// Exporting the configured application instance
export default app;