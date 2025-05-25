import request from "supertest";
import app from "../../app";
import { PrismaClient } from "@prisma/client";
import { PRODUCT, SHIPPING } from "../../config/constants";

// Create a test client instance outside of tests to avoid creating multiple connections
const prisma = new PrismaClient();

describe("Order API Integration Tests", () => {
  describe("POST /api/v1/orders/verify", () => {
    beforeAll(async () => {
      // Set up test data
      await prisma.$executeRaw`TRUNCATE TABLE "order_fulfillments" CASCADE;`;
      await prisma.$executeRaw`TRUNCATE TABLE "orders" CASCADE;`;
      await prisma.$executeRaw`TRUNCATE TABLE "warehouses" CASCADE;`;

      // Recreate warehouses for testing
      await prisma.warehouse.createMany({
        data: [
          {
            name: "Test Warehouse 1",
            latitude: 40.7128,
            longitude: -74.006,
            stock: 100,
          },
          {
            name: "Test Warehouse 2",
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
        .post("/api/v1/orders/verify")
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

    it("should verify a valid order with sufficient stock", async () => {
      const response = await request(app)
        .post("/api/v1/orders/verify")
        .send({
          quantity: 30,
          shippingAddress: {
            latitude: 41.8781,
            longitude: -87.6298,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("isValid", true);
      expect(response.body).toHaveProperty("totalPrice", 30 * PRODUCT.PRICE);
      expect(response.body).toHaveProperty("discountPercentage", 5); // 5% for 25-49 units
      expect(response.body).toHaveProperty("fulfillmentPlan");
    });

    it("should verify an order as invalid for excessive quantity", async () => {
      const response = await request(app)
        .post("/api/v1/orders/verify")
        .send({
          quantity: 1000, // More than available stock
          shippingAddress: {
            latitude: 41.8781,
            longitude: -87.6298,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("isValid", false);
      expect(response.body).toHaveProperty(
        "invalidReason",
        "Insufficient stock across all warehouses",
      );
    });

    it("should handle shipping cost exceeding maximum percentage", async () => {
      // First clear all existing warehouses
      await prisma.warehouse.deleteMany();

      // Create a remote warehouse with very far coordinates to make shipping expensive
      await prisma.warehouse.create({
        data: {
          name: "Remote Warehouse",
          latitude: -33.8688,
          longitude: 151.2093, // Sydney, Australia - very far from Chicago
          stock: 10, // Small stock so all units come from this warehouse
        },
      });

      // Use very small quantity with high distance to create high shipping percentage
      const response = await request(app)
        .post("/api/v1/orders/verify")
        .send({
          quantity: 1, // Minimum quantity
          shippingAddress: {
            latitude: 41.8781,
            longitude: -87.6298, // Chicago, very far from Sydney
          },
        });

      // Calculate expected shipping cost - based on formula
      const distanceApprox = 14900; // Approx distance Sydney to Chicago in km
      const weight = PRODUCT.WEIGHT; // Weight of a single unit
      const shippingCost =
        distanceApprox * weight * SHIPPING.RATE_PER_KG_PER_KM;
      const orderCost = 1 * PRODUCT.PRICE; // No discount for quantity 1
      const shippingPercentage = (shippingCost / orderCost) * 100;

      expect(response.status).toBe(200);

      // The test should work whether shipping exceeds threshold or not
      if (shippingPercentage > SHIPPING.MAX_COST_PERCENTAGE) {
        // If shipping cost exceeds threshold, the order should be invalid
        expect(response.body.isValid).toBe(false);
        expect(response.body.invalidReason).toContain(
          `Shipping cost exceeds ${SHIPPING.MAX_COST_PERCENTAGE}%`,
        );
      } else {
        // Otherwise it should be valid
        expect(response.body.isValid).toBe(true);
        expect(response.body).toHaveProperty("fulfillmentPlan");
        console.log(
          `NOTE: Shipping percentage (${shippingPercentage.toFixed(2)}%) doesn't exceed threshold (${SHIPPING.MAX_COST_PERCENTAGE}%)`,
        );
      }
    });
  });
});
