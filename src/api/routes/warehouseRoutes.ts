import express from "express";
import { WarehouseController } from "../controllers/warehouseController";

const router = express.Router();

/**
 * @swagger
 * /api/v1/warehouses:
 *   get:
 *     summary: Get all warehouses
 *     description: Retrieves a list of all warehouses with their current stock levels
 *     tags: [Warehouses]
 *     responses:
 *       200:
 *         description: List of warehouses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   stock:
 *                     type: integer
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/", WarehouseController.getAllWarehouses);

/**
 * @swagger
 * /api/v1/warehouses/{id}:
 *   get:
 *     summary: Get warehouse by ID
 *     description: Retrieves warehouse details by ID
 *     tags: [Warehouses]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Warehouse ID
 *     responses:
 *       200:
 *         description: Warehouse retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 latitude:
 *                   type: number
 *                 longitude:
 *                   type: number
 *                 stock:
 *                   type: integer
 *       404:
 *         description: Warehouse not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/:id", WarehouseController.getWarehouseById);

export default router;
