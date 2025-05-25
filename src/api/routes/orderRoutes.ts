import express from "express";
import { OrderController } from "../controllers/orderController";

const router = express.Router();

// POST /api/v1/orders/verify - Verify an order without creating it
router.post("/verify", OrderController.verifyOrder);

// POST /api/v1/orders - Submit an order
router.post("/", OrderController.submitOrder);

export default router;
