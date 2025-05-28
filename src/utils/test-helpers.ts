// src/utils/test-helpers.ts
import { PrismaClient } from "@prisma/client";
import { ulid } from "ulid";

interface CreateWarehouseParams {
  name?: string;
  latitude?: number;
  longitude?: number;
  stock?: number;
}

export const createTestWarehouse = async (
  prisma: PrismaClient,
  {
    name = `test-warehouse-${ulid()}`,
    latitude = 0,
    longitude = 0,
    stock = 100,
  }: CreateWarehouseParams = {},
) => {
  return await prisma.warehouse.create({
    data: {
      name,
      latitude,
      longitude,
      stock,
    },
  });
};

export const cleanupTestData = async (prisma: PrismaClient): Promise<void> => {
  await prisma.$transaction([
    prisma.orderFulfillment.deleteMany(),
    prisma.order.deleteMany(),
    prisma.warehouse.deleteMany({
      where: {
        name: {
          startsWith: "test-",
        },
      },
    }),
  ]);
};

export const setupTestEnvironment = async (
  prisma: PrismaClient,
): Promise<void> => {
  await cleanupTestData(prisma);
};

export const disconnectAndCleanup = async (
  prisma: PrismaClient,
): Promise<void> => {
  try {
    await cleanupTestData(prisma);
  } finally {
    await prisma.$disconnect();
  }
};

// Export as default for both ESM and Jest
export default {
  createTestWarehouse,
  cleanupTestData,
  setupTestEnvironment,
  disconnectAndCleanup,
};
