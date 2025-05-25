import request from "supertest";
import app from "../../app";
import prisma from "../../config/test-db";
import { ulid } from "ulid";
import {
  createTestWarehouse,
  cleanupTestData,
  setupTestEnvironment,
} from "../../utils/test-helpers";

describe("Order API Submission Integration Tests", () => {
  describe("POST /api/v1/orders", () => {
    beforeAll(async () => {
      await setupTestEnvironment(prisma);

      // Create test warehouses
      await createTestWarehouse(prisma, {
        name: `test-submit-1-${ulid()}`,
        latitude: 40.7128,
        longitude: -74.006,
        stock: 100,
      });

      await createTestWarehouse(prisma, {
        name: `test-submit-2-${ulid()}`,
        latitude: 34.0522,
        longitude: -118.2437,
        stock: 150,
      });
    });

    afterAll(async () => {
      await cleanupTestData(prisma);
    });

    it("should return 400 for invalid request data", async () => {
      const response = await request(app)
        .post("/api/v1/orders")
        .send({
          quantity: -1, // Invalid quantity
          shippingAddress: {
            latitude: 91, // Invalid latitude
            longitude: -74.006,
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should submit a valid order and return order number", async () => {
      const response = await request(app)
        .post("/api/v1/orders")
        .send({
          quantity: 10,
          shippingAddress: {
            latitude: 40.7128,
            longitude: -74.006,
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.orderNumber).toBeDefined();
      expect(response.body.totalPrice).toBeGreaterThan(0);
    });

    it("should return 422 for invalid orders with insufficient stock", async () => {
      const response = await request(app)
        .post("/api/v1/orders")
        .send({
          quantity: 1000, // More than total available stock
          shippingAddress: {
            latitude: 40.7128,
            longitude: -74.006,
          },
        });

      expect(response.status).toBe(422);
      expect(response.body.message).toBe(
        "Insufficient stock across all warehouses",
      );
    });
  });
});
