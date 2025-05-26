// src/api/__tests__/warehouseRoutes.test.ts
import request from "supertest";
import app from "../../app";
import prisma from "../../config/test-db";
import { cleanupAllData, setupTestEnvironment } from "../../utils/test-simple";

describe("Warehouse API Tests", () => {
  // Test environment data
  let testEnv: {
    warehouses: Array<{
      id: string;
      name: string;
      stock: number;
      latitude: number;
      longitude: number;
    }>;
    totalStock: number;
  };

  // Set up the test data once before all tests
  beforeAll(async () => {
    testEnv = await setupTestEnvironment(prisma);
  });

  // Clean up after all tests
  afterAll(async () => {
    await cleanupAllData(prisma);
    await prisma.$disconnect();
  });

  describe("GET /api/v1/warehouses", () => {
    it("should return a list of warehouses", async () => {
      const response = await request(app).get("/api/v1/warehouses");

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(
        testEnv.warehouses.length,
      );

      // Check if all our test warehouses are included in the response
      const responseIds = response.body.map((w: any) => w.id);
      for (const warehouse of testEnv.warehouses) {
        expect(responseIds).toContain(warehouse.id);
      }

      // Check warehouse data structure
      const firstWarehouse = response.body[0];
      expect(firstWarehouse).toHaveProperty("id");
      expect(firstWarehouse).toHaveProperty("name");
      expect(firstWarehouse).toHaveProperty("latitude");
      expect(firstWarehouse).toHaveProperty("longitude");
      expect(firstWarehouse).toHaveProperty("stock");
    });
  });

  describe("GET /api/v1/warehouses/:id", () => {
    it("should return a warehouse by ID", async () => {
      // Use the first test warehouse
      const testWarehouse = testEnv.warehouses[0];

      const response = await request(app).get(
        `/api/v1/warehouses/${testWarehouse.id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", testWarehouse.id);
      expect(response.body).toHaveProperty("name", testWarehouse.name);
      expect(response.body).toHaveProperty("latitude", testWarehouse.latitude);
      expect(response.body).toHaveProperty(
        "longitude",
        testWarehouse.longitude,
      );
      expect(response.body).toHaveProperty("stock", testWarehouse.stock);
    });

    it("should return 404 for non-existent warehouse ID", async () => {
      const response = await request(app).get(
        "/api/v1/warehouses/non-existent-id",
      );
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
    });
  });
});
