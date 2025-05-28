import request from "supertest";
import app from "../../app";
import prisma from "../../config/test-db";
import { ulid } from "ulid";
import {
  createTestWarehouse,
  cleanupTestData,
  setupTestEnvironment,
} from "../../utils/test-helpers";

describe("Order API Integration Tests", () => {
  describe("POST /api/v1/orders/verify", () => {
    beforeAll(async () => {
      // This makes sure we start with a clean database
      await setupTestEnvironment(prisma);

      // Delete all warehouses to ensure we have full control over available stock
      await prisma.warehouse.deleteMany();

      // Create test warehouses with controlled stock levels (total: 900 units)
      await createTestWarehouse(prisma, {
        name: `test-nyc-${ulid()}`,
        latitude: 40.7128,
        longitude: -74.006,
        stock: 300,
      });

      await createTestWarehouse(prisma, {
        name: `test-la-${ulid()}`,
        latitude: 34.0522,
        longitude: -118.2437,
        stock: 400,
      });

      await createTestWarehouse(prisma, {
        name: `test-london-${ulid()}`,
        latitude: 51.5074,
        longitude: -0.1278,
        stock: 200,
      });

      // Total stock across all warehouses: 900 units
    });

    afterAll(async () => {
      await cleanupTestData(prisma);
    });

    it("should return 400 for invalid request data", async () => {
      const response = await request(app)
        .post("/api/v1/orders/verify")
        .send({
          quantity: -1,
          shippingAddress: {
            latitude: 91, // Invalid latitude
            longitude: -74.006,
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should verify a valid order with sufficient stock", async () => {
      const response = await request(app)
        .post("/api/v1/orders/verify")
        .send({
          quantity: 25,
          shippingAddress: {
            latitude: 40.7128,
            longitude: -74.006,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.isValid).toBe(true);
      expect(response.body.discountPercentage).toBe(5); // 5% discount for 25+ units
      expect(response.body.fulfillmentPlan).toBeDefined();
      expect(response.body.fulfillmentPlan.length).toBeGreaterThan(0);
    });

    it("should verify an order as invalid for excessive quantity", async () => {
      // Make sure we're using a quantity greater than our total warehouse stock (900)
      const excessiveQuantity = 950;

      const response = await request(app)
        .post("/api/v1/orders/verify")
        .send({
          quantity: excessiveQuantity,
          shippingAddress: {
            latitude: 40.7128,
            longitude: -74.006,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.isValid).toBe(false);
      expect(response.body.invalidReason).toBe(
        "Insufficient stock across all warehouses",
      );
    });

    it("should handle shipping cost exceeding maximum percentage", async () => {
      // Testing with a very distant location to trigger high shipping costs
      const response = await request(app)
        .post("/api/v1/orders/verify")
        .send({
          quantity: 1,
          shippingAddress: {
            latitude: -33.8688, // Sydney, Australia
            longitude: 151.2093,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.isValid).toBe(false);
      expect(response.body.invalidReason).toBe(
        "Shipping cost exceeds maximum percentage of order value",
      );
    });

    it("should return 400 for invalid quantity", async () => {
      const response = await request(app)
        .post("/api/v1/orders/verify")
        .send({
          quantity: -5,
          shippingAddress: {
            latitude: 40.7128,
            longitude: -74.006,
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
      expect(response.body.message).toContain(
        "Quantity must be greater than 0",
      );
    });

    it("should return 400 for invalid latitude", async () => {
      const response = await request(app)
        .post("/api/v1/orders/verify")
        .send({
          quantity: 10,
          shippingAddress: {
            latitude: 100, // Invalid latitude
            longitude: -74.006,
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
      expect(response.body.message).toContain(
        "Latitude must be between -90 and 90",
      );
    });

    it("should return 400 for invalid longitude", async () => {
      const response = await request(app)
        .post("/api/v1/orders/verify")
        .send({
          quantity: 10,
          shippingAddress: {
            latitude: 40.7128,
            longitude: -200, // Invalid longitude
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
      expect(response.body.message).toContain(
        "Longitude must be between -180 and 180",
      );
    });
  });
});
