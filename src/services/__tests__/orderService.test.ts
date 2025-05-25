import { OrderService } from "../orderService";
import { DiscountService } from "../discountService";
import { ShippingService } from "../shippingService";
import { WarehouseRepository } from "../../repositories/warehouseRepository";
import { SHIPPING } from "../../config/constants";

// Mocks
jest.mock("../discountService");
jest.mock("../shippingService");
jest.mock("../../repositories/warehouseRepository");

describe("OrderService", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("verifyOrder", () => {
    it("should return invalid result for zero or negative quantity", async () => {
      const result = await OrderService.verifyOrder(0, {
        latitude: 40.7128,
        longitude: -74.006,
      });

      expect(result.isValid).toBe(false);
      expect(result.invalidReason).toBe("Quantity must be greater than 0");
    });

    it("should correctly verify a valid order", async () => {
      // Setup mocks
      const mockWarehouses = [
        {
          id: "w1",
          name: "Warehouse 1",
          latitude: 1,
          longitude: 1,
          stock: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockDiscountResult = {
        discountPercentage: 5,
        discountedPrice: 1425,
        basePrice: 1500,
      };

      const mockFulfillmentResult = {
        fulfillmentPlan: [
          {
            warehouseId: "w1",
            warehouseName: "Warehouse 1",
            units: 10,
            cost: 50,
            distance: 100,
          },
        ],
        totalShippingCost: 50,
        sufficientStock: true,
      };

      (WarehouseRepository.getAllWarehouses as jest.Mock).mockResolvedValue(
        mockWarehouses,
      );
      (DiscountService.calculateDiscount as jest.Mock).mockReturnValue(
        mockDiscountResult,
      );
      (
        ShippingService.determineOptimalFulfillment as jest.Mock
      ).mockReturnValue(mockFulfillmentResult);

      // Call the method
      const result = await OrderService.verifyOrder(10, {
        latitude: 40.7128,
        longitude: -74.006,
      });

      // Assertions
      expect(result.isValid).toBe(true);
      expect(result.totalPrice).toBe(mockDiscountResult.basePrice);
      expect(result.discountPercentage).toBe(
        mockDiscountResult.discountPercentage,
      );
      expect(result.discountedPrice).toBe(mockDiscountResult.discountedPrice);
      expect(result.shippingCost).toBe(mockFulfillmentResult.totalShippingCost);
      expect(result.fulfillmentPlan).toBe(
        mockFulfillmentResult.fulfillmentPlan,
      );
    });

    it("should return invalid result when shipping cost exceeds limit", async () => {
      // Setup mocks
      const mockWarehouses = [
        {
          id: "w1",
          name: "Warehouse 1",
          latitude: 1,
          longitude: 1,
          stock: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockDiscountResult = {
        discountPercentage: 5,
        discountedPrice: 1425, // $1,425
        basePrice: 1500,
      };

      // Make shipping cost above 15% of discounted price
      const mockFulfillmentResult = {
        fulfillmentPlan: [
          {
            warehouseId: "w1",
            warehouseName: "Warehouse 1",
            units: 10,
            cost: 250, // ~17.5% of discounted price
            distance: 5000,
          },
        ],
        totalShippingCost: 250,
        sufficientStock: true,
      };

      (WarehouseRepository.getAllWarehouses as jest.Mock).mockResolvedValue(
        mockWarehouses,
      );
      (DiscountService.calculateDiscount as jest.Mock).mockReturnValue(
        mockDiscountResult,
      );
      (
        ShippingService.determineOptimalFulfillment as jest.Mock
      ).mockReturnValue(mockFulfillmentResult);

      // Call the method
      const result = await OrderService.verifyOrder(10, {
        latitude: 40.7128,
        longitude: -74.006,
      });

      // Assertions
      expect(result.isValid).toBe(false);
      expect(result.invalidReason).toContain(
        `Shipping cost exceeds maximum percentage of order value`,
      );
    });

    it("should return invalid result when insufficient stock", async () => {
      // Setup mocks
      const mockWarehouses = [
        {
          id: "w1",
          name: "Warehouse 1",
          latitude: 1,
          longitude: 1,
          stock: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockDiscountResult = {
        discountPercentage: 5,
        discountedPrice: 1425,
        basePrice: 1500,
      };

      const mockFulfillmentResult = {
        fulfillmentPlan: [
          {
            warehouseId: "w1",
            warehouseName: "Warehouse 1",
            units: 10,
            cost: 50,
            distance: 100,
          },
        ],
        totalShippingCost: 50,
        sufficientStock: false,
      };

      (WarehouseRepository.getAllWarehouses as jest.Mock).mockResolvedValue(
        mockWarehouses,
      );
      (DiscountService.calculateDiscount as jest.Mock).mockReturnValue(
        mockDiscountResult,
      );
      (
        ShippingService.determineOptimalFulfillment as jest.Mock
      ).mockReturnValue(mockFulfillmentResult);

      // Call the method
      const result = await OrderService.verifyOrder(10, {
        latitude: 40.7128,
        longitude: -74.006,
      });

      // Assertions
      expect(result.isValid).toBe(false);
      expect(result.invalidReason).toBe(
        "Insufficient stock across all warehouses",
      );
    });
  });
});
