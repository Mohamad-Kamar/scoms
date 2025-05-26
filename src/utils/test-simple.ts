// src/utils/test-simple.ts
import { PrismaClient } from "@prisma/client";

/**
 * Standardized test data for all tests
 */
export const TEST_DATA = {
  warehouses: [
    {
      id: "warehouse-1",
      name: "Test Warehouse 1",
      latitude: 40.7128,
      longitude: -74.006,
      stock: 500,
    },
    {
      id: "warehouse-2",
      name: "Test Warehouse 2",
      latitude: 34.0522,
      longitude: -118.2437,
      stock: 300,
    },
    {
      id: "warehouse-3",
      name: "Test Warehouse 3",
      latitude: 51.5074,
      longitude: -0.1278,
      stock: 200,
    },
  ],
  locations: {
    nyc: { latitude: 40.7128, longitude: -74.006 },
    la: { latitude: 34.0522, longitude: -118.2437 },
    london: { latitude: 51.5074, longitude: -0.1278 },
    sydney: { latitude: -33.8688, longitude: 151.2093 },
  },
  // Pre-calculated values for test cases
  quantities: {
    valid: 25, // Small enough for stock but large enough for discount
    excessive: 1100, // More than total stock (1000)
    single: 1, // Just 1 item for testing
  },
};

/**
 * Clean up all test data from the database
 * @param prisma PrismaClient instance
 */
export const cleanupAllData = async (prisma: PrismaClient): Promise<void> => {
  await prisma.$transaction([
    prisma.orderFulfillment.deleteMany(),
    prisma.order.deleteMany(),
    prisma.warehouse.deleteMany(),
  ]);
};

/**
 * Set up a complete test environment with standard data
 * @param prisma PrismaClient instance
 * @returns Test environment data
 */
export const setupTestEnvironment = async (prisma: PrismaClient) => {
  // Clean existing data
  await cleanupAllData(prisma);

  // Create warehouses with predetermined data
  for (const warehouse of TEST_DATA.warehouses) {
    await prisma.warehouse.create({
      data: warehouse,
    });
  }

  // Calculate total stock for convenience
  const totalStock = TEST_DATA.warehouses.reduce((sum, w) => sum + w.stock, 0);

  return {
    warehouses: TEST_DATA.warehouses,
    locations: TEST_DATA.locations,
    totalStock,
    testQuantity: TEST_DATA.quantities.valid,
    excessiveQuantity: TEST_DATA.quantities.excessive,
  };
};

/**
 * Reset just order data, keeping warehouses intact
 * @param prisma PrismaClient instance
 */
export const resetOrderData = async (prisma: PrismaClient): Promise<void> => {
  await prisma.$transaction([
    prisma.orderFulfillment.deleteMany(),
    prisma.order.deleteMany(),
  ]);
};
