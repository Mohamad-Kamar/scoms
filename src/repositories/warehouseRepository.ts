import { Warehouse } from "@prisma/client";
import prisma from "../config/db";

/**
 * Repository for warehouse-related database operations
 */
export class WarehouseRepository {
  /**
   * Get all warehouses with their current stock levels
   * @returns Array of warehouse records
   */
  public static async getAllWarehouses(): Promise<Warehouse[]> {
    return await prisma.warehouse.findMany({
      orderBy: {
        name: "asc",
      },
    });
  }

  /**
   * Get a single warehouse by its ID
   * @param id Warehouse ID
   * @returns Warehouse record or null if not found
   */
  public static async getWarehouseById(id: string): Promise<Warehouse | null> {
    return await prisma.warehouse.findUnique({
      where: {
        id,
      },
    });
  }
}
