import express from "express";
import { OrderController } from "../controllers/orderController";

const router = express.Router();

/**
 * @swagger
 * /api/v1/orders/verify:
 *   post:
 *     summary: Verify order details without creating it
 *     description: |
 *       Calculates prices, discounts, checks stock availability, and validates shipping costs.
 *       Use this endpoint to validate an order before submitting it.
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderVerifyRequest'
 *           example:
 *             quantity: 30
 *             shippingAddress:
 *               latitude: 40.7128
 *               longitude: -74.006
 *     responses:
 *       200:
 *         description: Order verification successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderVerifyResponse'
 *             example:
 *               totalPrice: 4500
 *               discountPercentage: 5
 *               discountedPrice: 4275
 *               shippingCost: 120
 *               isValid: true
 *               fulfillmentPlan:
 *                 - warehouseId: "warehouse-123"
 *                   warehouseName: "New York Warehouse"
 *                   units: 30
 *                   cost: 120
 *                   distance: 50
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post("/verify", OrderController.verifyOrder);

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: Submit a new order
 *     description: |
 *       Creates a new order and updates warehouse inventory.
 *       The order will be validated before being processed.
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderVerifyRequest'
 *           example:
 *             quantity: 30
 *             shippingAddress:
 *               latitude: 40.7128
 *               longitude: -74.006
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/OrderVerifyResponse'
 *                 - type: object
 *                   properties:
 *                     orderNumber:
 *                       type: string
 *                       description: Unique order identifier
 *                       example: "ORD-20250526-ABC123"
 *             example:
 *               orderNumber: "ORD-20250526-ABC123"
 *               totalPrice: 4500
 *               discountPercentage: 5
 *               discountedPrice: 4275
 *               shippingCost: 120
 *               isValid: true
 *               fulfillmentPlan:
 *                 - warehouseId: "warehouse-123"
 *                   warehouseName: "New York Warehouse"
 *                   units: 30
 *                   cost: 120
 *                   distance: 50
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post("/", OrderController.submitOrder);

export default router;
