import request from "supertest";
import app from "../../app";
import { PrismaClient } from "@prisma/client";
import { PRODUCT } from "../../config/constants";

// Create a test client instance outside of tests to avoid creating multiple connections
const prisma = new PrismaClient();

describe("Order API Submission Integration Tests", () => {
  describe("POST /api/v1/orders", () => {
    beforeAll(async () => {
      // Set up test data
      await prisma.$executeRaw`TRUNCATE TABLE "order_fulfillments" CASCADE;`;
      await prisma.$executeRaw`TRUNCATE TABLE "orders" CASCADE;`;
      await prisma.$executeRaw`TRUNCATE TABLE "warehouses" CASCADE;`;

      // Recreate warehouses for testing
      await prisma.warehouse.createMany({
        data: [
          {
            name: "Test Warehouse Submit 1",
            latitude: 40.7128,
            longitude: -74.006,
            stock: 100,
          },
          {
            name: "Test Warehouse Submit 2",
            latitude: 34.0522,
            longitude: -118.2437,
            stock: 50,
          },
        ],
      });
    });

    afterAll(async () => {
      await prisma.$disconnect();
    });

    it("should return 400 for invalid request data", async () => {
      const response = await request(app)
        .post("/api/v1/orders")
        .send({
          // Missing quantity
          shippingAddress: {
            latitude: 41.8781,
            longitude: -87.6298,
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation Error");
    });

    it("should submit a valid order and return order number", async () => {
      // First make sure we have warehouses with sufficient stock
      await prisma.warehouse.updateMany({
        data: {
          stock: 100, // Reset to ensure we have enough stock
        },
        where: {
          name: "Test Warehouse Submit 1",
        },
      });

      await prisma.warehouse.updateMany({
        data: {
          stock: 50,
        },
        where: {
          name: "Test Warehouse Submit 2",
        },
      });

      const response = await request(app)
        .post("/api/v1/orders")
        .send({
          quantity: 25, // Lower quantity to be safe
          shippingAddress: {
            latitude: 41.8781,
            longitude: -87.6298,
          },
        });

      console.log("Test response status:", response.status);
      console.log(
        "Test response body:",
        JSON.stringify(response.body, null, 2),
      );

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("isValid", true);
      expect(response.body).toHaveProperty("orderNumber");
      expect(typeof response.body.orderNumber).toBe("string");
      expect(response.body.orderNumber.length).toBeGreaterThan(0);
      expect(response.body).toHaveProperty("totalPrice", 25 * PRODUCT.PRICE);
      expect(response.body).toHaveProperty("discountPercentage", 5); // 5% for 25-49 units
    });

    it("should return 422 for invalid orders with insufficient stock", async () => {
      // Clear warehouse data for this test to create insufficient stock
      await prisma.warehouse.updateMany({
        data: {
          stock: 5, // Not enough for our order
        },
      });

      const response = await request(app)
        .post("/api/v1/orders")
        .send({
          quantity: 100,
          shippingAddress: {
            latitude: 41.8781,
            longitude: -87.6298,
          },
        });

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty("error", "Invalid Order");
      expect(response.body.message).toContain("Insufficient stock");
    });

    // Restore warehouse stock for other tests
    afterEach(async () => {
      await prisma.warehouse.updateMany({
        data: {
          stock: 100,
        },
        where: {
          name: "Test Warehouse Submit 1",
        },
      });

      await prisma.warehouse.updateMany({
        data: {
          stock: 50,
        },
        where: {
          name: "Test Warehouse Submit 2",
        },
      });
    });
  });
});
