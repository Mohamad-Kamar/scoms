// src/api/__tests__/orderRoutes.test.ts
import request from "supertest";
import app from "../../app";
import prisma from "../../config/test-db";
import {
  cleanupAllData,
  resetOrderData,
  setupTestEnvironment,
} from "../../utils/test-simple";

describe("Order API Tests", () => {
  // Test environment data
  let testEnv: {
    warehouses: Array<{
      id: string;
      name: string;
      stock: number;
      latitude: number;
      longitude: number;
    }>;
    locations: {
      nyc: { latitude: number; longitude: number };
      la: { latitude: number; longitude: number };
      london: { latitude: number; longitude: number };
      sydney: { latitude: number; longitude: number };
    };
    totalStock: number;
    testQuantity: number;
    excessiveQuantity: number;
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

  // Reset order data before each test to ensure isolation
  beforeEach(async () => {
    await resetOrderData(prisma);
  });

  describe("POST /api/v1/orders/verify", () => {
    it("should return 400 for invalid request data", async () => {
      const response = await request(app).post("/api/v1/orders/verify").send({
        // Missing quantity
        shippingAddress: testEnv.locations.nyc,
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("should verify a valid order with sufficient stock", async () => {
      const response = await request(app).post("/api/v1/orders/verify").send({
        quantity: testEnv.testQuantity,
        shippingAddress: testEnv.locations.nyc,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("isValid", true);
      expect(response.body).toHaveProperty("totalPrice");
      expect(response.body).toHaveProperty("discountPercentage");
      expect(response.body).toHaveProperty("discountedPrice");
      expect(response.body).toHaveProperty("shippingCost");
      expect(response.body).toHaveProperty("fulfillmentPlan");
    });

    it("should verify an order as invalid for excessive quantity", async () => {
      const response = await request(app).post("/api/v1/orders/verify").send({
        quantity: testEnv.excessiveQuantity,
        shippingAddress: testEnv.locations.nyc,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("isValid", false);
      expect(response.body).toHaveProperty("invalidReason");
    });
  });

  describe("POST /api/v1/orders", () => {
    it("should return 400 for invalid request data", async () => {
      const response = await request(app).post("/api/v1/orders").send({
        // Invalid negative quantity
        quantity: -5,
        shippingAddress: testEnv.locations.nyc,
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("should submit a valid order and return order number", async () => {
      const response = await request(app).post("/api/v1/orders").send({
        quantity: testEnv.testQuantity,
        shippingAddress: testEnv.locations.nyc,
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("isValid", true);
      expect(response.body).toHaveProperty("orderNumber");
      expect(response.body.orderNumber).toBeTruthy();

      // Check that the warehouses have been updated with the new stock levels
      const warehouses = await prisma.warehouse.findMany();
      const totalRemainingStock = warehouses.reduce(
        (sum, w) => sum + w.stock,
        0,
      );
      expect(totalRemainingStock).toBe(
        testEnv.totalStock - testEnv.testQuantity,
      );
    });

    it("should return 422 for invalid orders with insufficient stock", async () => {
      const response = await request(app).post("/api/v1/orders").send({
        quantity: testEnv.excessiveQuantity,
        shippingAddress: testEnv.locations.nyc,
      });

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Invalid Order");
    });
  });
});
