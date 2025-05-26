import { Request, Response } from "express";
import { WarehouseRepository } from "../../repositories/warehouseRepository";
import logger from "../../utils/logger";

export class WarehouseController {
  /**
   * Get all warehouses with their current stock levels
   */
  public static async getAllWarehouses(
    _req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const warehouses = await WarehouseRepository.getAllWarehouses();
      res.status(200).json(warehouses);
    } catch (error) {
      logger.error(
        `Error retrieving warehouses: ${error instanceof Error ? error.message : String(error)}`,
      );
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to retrieve warehouses",
      });
    }
  }

  /**
   * Get a specific warehouse by ID
   */
  public static async getWarehouseById(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const warehouse = await WarehouseRepository.getWarehouseById(id);

      if (!warehouse) {
        res.status(404).json({
          error: "Not Found",
          message: `Warehouse with ID ${id} not found`,
        });
        return;
      }

      res.status(200).json(warehouse);
    } catch (error) {
      logger.error(
        `Error retrieving warehouse: ${error instanceof Error ? error.message : String(error)}`,
      );
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to retrieve warehouse details",
      });
    }
  }
}
