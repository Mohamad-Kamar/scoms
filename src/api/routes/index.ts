import express from "express";
import orderRoutes from "./orderRoutes";
import warehouseRoutes from "./warehouseRoutes";

const router = express.Router();

// API version prefix
const API_PREFIX = "/api/v1";

// Register routes
router.use(`${API_PREFIX}/orders`, orderRoutes);
router.use(`${API_PREFIX}/warehouses`, warehouseRoutes);

export default router;
