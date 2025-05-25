import express from "express";
import orderRoutes from "./orderRoutes";

const router = express.Router();

// API version prefix
const API_PREFIX = "/api/v1";

// Register routes
router.use(`${API_PREFIX}/orders`, orderRoutes);

export default router;
