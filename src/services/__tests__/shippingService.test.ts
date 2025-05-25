import { ShippingService } from "../shippingService";
import { SHIPPING, PRODUCT } from "../../config/constants";
import { calculateDistanceInKm } from "../../utils/geoUtils";

// Mock the geoUtils module
jest.mock("../../utils/geoUtils", () => ({
  calculateDistanceInKm: jest.fn(),
}));

describe("ShippingService", () => {
  describe("calculateShippingCostForSegment", () => {
    it("calculates the correct shipping cost based on distance and weight", () => {
      const distanceKm = 1000;
      const weightKg = 5;
      const expectedCost = distanceKm * weightKg * SHIPPING.RATE_PER_KG_PER_KM;

      const result = ShippingService.calculateShippingCostForSegment(
        distanceKm,
        weightKg,
      );

      expect(result).toEqual(expectedCost);
    });

    it("returns zero cost for zero distance", () => {
      const result = ShippingService.calculateShippingCostForSegment(0, 5);
      expect(result).toEqual(0);
    });

    it("returns zero cost for zero weight", () => {
      const result = ShippingService.calculateShippingCostForSegment(1000, 0);
      expect(result).toEqual(0);
    });

    it("throws error for negative distance", () => {
      expect(() => {
        ShippingService.calculateShippingCostForSegment(-100, 5);
      }).toThrow("Distance cannot be negative");
    });

    it("throws error for negative weight", () => {
      expect(() => {
        ShippingService.calculateShippingCostForSegment(100, -5);
      }).toThrow("Weight cannot be negative");
    });
  });

  describe("determineOptimalFulfillment", () => {
    beforeEach(() => {
      // Reset mocks before each test
      jest.resetAllMocks();
    });

    it("returns sufficient stock true when warehouses have enough stock", () => {
      const customerCoords = { latitude: 0, longitude: 0 };
      const warehouses = [
        {
          id: "w1",
          name: "Warehouse 1",
          latitude: 1,
          longitude: 1,
          stock: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "w2",
          name: "Warehouse 2",
          latitude: 2,
          longitude: 2,
          stock: 50,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock distance calculation
      (calculateDistanceInKm as jest.Mock).mockImplementation((from, to) => {
        if (to.latitude === 1) return 100; // Distance to Warehouse 1
        if (to.latitude === 2) return 200; // Distance to Warehouse 2
        return 0;
      });

      const quantity = 30;
      const result = ShippingService.determineOptimalFulfillment(
        quantity,
        customerCoords,
        warehouses,
      );

      // Should be fulfilled from Warehouse 1 (closest)
      expect(result.sufficientStock).toBeTruthy();
      expect(result.fulfillmentPlan.length).toBe(1);
      expect(result.fulfillmentPlan[0].warehouseId).toBe("w1");
      expect(result.fulfillmentPlan[0].units).toBe(30);
    });

    it("distributes order across multiple warehouses when needed", () => {
      const customerCoords = { latitude: 0, longitude: 0 };
      const warehouses = [
        {
          id: "w1",
          name: "Warehouse 1",
          latitude: 1,
          longitude: 1,
          stock: 20,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "w2",
          name: "Warehouse 2",
          latitude: 2,
          longitude: 2,
          stock: 15,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock distance calculation
      (calculateDistanceInKm as jest.Mock).mockImplementation((from, to) => {
        if (to.latitude === 1) return 100; // Distance to Warehouse 1
        if (to.latitude === 2) return 200; // Distance to Warehouse 2
        return 0;
      });

      const quantity = 30;
      const result = ShippingService.determineOptimalFulfillment(
        quantity,
        customerCoords,
        warehouses,
      );

      // Should use both warehouses
      expect(result.sufficientStock).toBeTruthy();
      expect(result.fulfillmentPlan.length).toBe(2);
      expect(result.fulfillmentPlan[0].warehouseId).toBe("w1");
      expect(result.fulfillmentPlan[0].units).toBe(20);
      expect(result.fulfillmentPlan[1].warehouseId).toBe("w2");
      expect(result.fulfillmentPlan[1].units).toBe(10);
    });

    it("returns sufficient stock false when warehouses don't have enough stock", () => {
      const customerCoords = { latitude: 0, longitude: 0 };
      const warehouses = [
        {
          id: "w1",
          name: "Warehouse 1",
          latitude: 1,
          longitude: 1,
          stock: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "w2",
          name: "Warehouse 2",
          latitude: 2,
          longitude: 2,
          stock: 15,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock distance calculation
      (calculateDistanceInKm as jest.Mock).mockImplementation(() => 100);

      const quantity = 30;
      const result = ShippingService.determineOptimalFulfillment(
        quantity,
        customerCoords,
        warehouses,
      );

      expect(result.sufficientStock).toBeFalsy();
      expect(result.fulfillmentPlan.length).toBe(2);
      // Even though insufficient, it should still create a plan with what's available
      expect(
        result.fulfillmentPlan[0].units + result.fulfillmentPlan[1].units,
      ).toBe(25);
    });

    it("calculates correct shipping costs for each segment", () => {
      const customerCoords = { latitude: 0, longitude: 0 };
      const warehouses = [
        {
          id: "w1",
          name: "Warehouse 1",
          latitude: 1,
          longitude: 1,
          stock: 20,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const distanceKm = 100;
      (calculateDistanceInKm as jest.Mock).mockReturnValue(distanceKm);

      const quantity = 10;
      const result = ShippingService.determineOptimalFulfillment(
        quantity,
        customerCoords,
        warehouses,
      );

      const expectedSegmentWeight = quantity * PRODUCT.WEIGHT;
      const expectedCost =
        distanceKm * expectedSegmentWeight * SHIPPING.RATE_PER_KG_PER_KM;

      expect(result.totalShippingCost).toEqual(expectedCost);
      expect(result.fulfillmentPlan[0].cost).toEqual(expectedCost);
    });
  });
});
