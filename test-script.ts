import { ShippingService } from "./src/services/shippingService";
import { WarehouseRepository } from "./src/repositories/warehouseRepository";
import prisma from "./src/config/test-db";

async function test() {
  try {
    const warehouses = await WarehouseRepository.getAllWarehouses();
    console.log("Warehouses:", warehouses);

    const result = ShippingService.determineOptimalFulfillment(
      1000,
      { latitude: 40.7128, longitude: -74.006 },
      warehouses,
    );

    console.log("Fulfillment result:", result);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
