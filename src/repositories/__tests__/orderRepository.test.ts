/* eslint-disable @typescript-eslint/no-explicit-any */
import { OrderStatus } from "@prisma/client";
import { OrderRepository } from "../orderRepository";
import { ulid } from "ulid";

// Mock the Prisma client
jest.mock("../../config/db", () => {
  // Create a mock of the Prisma client with proper TypeScript typing
  const mockPrismaClient: any = {
    $transaction: jest.fn((callback: any) => callback(mockPrismaClient)),
    warehouse: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    order: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    orderFulfillment: {
      create: jest.fn(),
    },
  };
  return mockPrismaClient;
});

// Mock ulid generation
jest.mock("ulid");
const mockUlid = ulid as jest.MockedFunction<typeof ulid>;

// Import the mocked prisma client
import prisma from "../../config/db";

describe("OrderRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createOrder", () => {
    it("should create an order successfully with sufficient stock", async () => {
      // Mock ulid for consistent testing
      const mockOrderNumber = "01H6TZZTNSXRXM1FBWMCKNT0AY";
      mockUlid.mockReturnValue(mockOrderNumber);

      // Mock warehouse data
      const mockWarehouse1 = {
        id: "wh-1",
        name: "Test Warehouse 1",
        stock: 100,
        latitude: 40.7128,
        longitude: -74.006,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockWarehouse2 = {
        id: "wh-2",
        name: "Test Warehouse 2",
        stock: 50,
        latitude: 35.6762,
        longitude: 139.6503,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock order and order ID
      const mockOrderId = "ord-1";
      const mockOrder = {
        id: mockOrderId,
        orderNumber: mockOrderNumber,
        customerLatitude: 41.8781,
        customerLongitude: -87.6298,
        quantityOrdered: 20,
        basePrice: 3000,
        discountPercentage: 5,
        priceAfterDiscount: 2850,
        totalShippingCost: 100,
        status: OrderStatus.CONFIRMED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Setup mocks
      (prisma.warehouse.findMany as jest.Mock).mockResolvedValue([
        mockWarehouse1,
        mockWarehouse2,
      ]);
      (prisma.order.create as jest.Mock).mockResolvedValue(mockOrder);

      // Test order data
      const orderData = {
        customerCoordinates: {
          latitude: 41.8781,
          longitude: -87.6298,
        },
        quantity: 20,
        basePrice: 3000,
        discountPercentage: 5,
        discountedPrice: 2850,
        shippingCost: 100,
        fulfillmentPlan: [
          {
            warehouseId: "wh-1",
            warehouseName: "Test Warehouse 1",
            units: 15,
            cost: 75,
            distance: 800,
          },
          {
            warehouseId: "wh-2",
            warehouseName: "Test Warehouse 2",
            units: 5,
            cost: 25,
            distance: 1200,
          },
        ],
        status: OrderStatus.CONFIRMED,
      };

      // Execute the method
      const result = await OrderRepository.createOrder(orderData);

      // Assertions
      expect(result).toEqual({
        orderId: mockOrderId,
        orderNumber: mockOrderNumber,
      });
      expect(prisma.warehouse.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.order.create).toHaveBeenCalledWith({
        data: {
          orderNumber: mockOrderNumber,
          customerLatitude: orderData.customerCoordinates.latitude,
          customerLongitude: orderData.customerCoordinates.longitude,
          quantityOrdered: orderData.quantity,
          basePrice: orderData.basePrice,
          discountPercentage: orderData.discountPercentage,
          priceAfterDiscount: orderData.discountedPrice,
          totalShippingCost: orderData.shippingCost,
          status: OrderStatus.CONFIRMED,
        },
      });
      expect(prisma.orderFulfillment.create).toHaveBeenCalledTimes(2);
      expect(prisma.warehouse.update).toHaveBeenCalledTimes(2);
    });

    it("should throw error when warehouse is not found", async () => {
      // Mock ulid
      mockUlid.mockReturnValue("01H6TZZTNSXRXM1FBWMCKNT0AY");

      // Mock empty warehouses list
      (prisma.warehouse.findMany as jest.Mock).mockResolvedValue([]);

      // Test order data with non-existent warehouse
      const orderData = {
        customerCoordinates: {
          latitude: 41.8781,
          longitude: -87.6298,
        },
        quantity: 10,
        basePrice: 1500,
        discountPercentage: 0,
        discountedPrice: 1500,
        shippingCost: 50,
        fulfillmentPlan: [
          {
            warehouseId: "non-existent",
            warehouseName: "Non-existent Warehouse",
            units: 10,
            cost: 50,
            distance: 500,
          },
        ],
      };

      // Execute and expect error
      await expect(OrderRepository.createOrder(orderData)).rejects.toThrow(
        "Warehouse with ID non-existent not found and no warehouse with name Non-existent Warehouse found",
      );
    });

    it("should throw error when warehouse has insufficient stock", async () => {
      // Mock warehouse with low stock
      const mockWarehouse = {
        id: "wh-3",
        name: "Low Stock Warehouse",
        stock: 5, // Only 5 units in stock
        latitude: 51.5074,
        longitude: -0.1278,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock warehouse retrieval
      (prisma.warehouse.findMany as jest.Mock).mockResolvedValue([
        mockWarehouse,
      ]);

      // Test order data requesting more than available
      const orderData = {
        customerCoordinates: {
          latitude: 51.5074,
          longitude: -0.1278,
        },
        quantity: 10,
        basePrice: 1500,
        discountPercentage: 0,
        discountedPrice: 1500,
        shippingCost: 20,
        fulfillmentPlan: [
          {
            warehouseId: "wh-3",
            warehouseName: "Low Stock Warehouse",
            units: 10, // Requesting more than available
            cost: 20,
            distance: 200,
          },
        ],
      };

      // Execute and expect error
      await expect(OrderRepository.createOrder(orderData)).rejects.toThrow(
        "Insufficient stock in warehouse Low Stock Warehouse",
      );
    });
  });

  describe("getOrderByOrderNumber", () => {
    it("should retrieve an order by order number including fulfillments", async () => {
      const mockOrderNumber = "01H6TZZTNSXRXM1FBWMCKNT0AY";
      const mockOrderWithFulfillments = {
        id: "ord-1",
        orderNumber: mockOrderNumber,
        customerLatitude: 41.8781,
        customerLongitude: -87.6298,
        quantityOrdered: 20,
        basePrice: 3000,
        discountPercentage: 5,
        priceAfterDiscount: 2850,
        totalShippingCost: 100,
        status: OrderStatus.CONFIRMED,
        createdAt: new Date(),
        updatedAt: new Date(),
        orderFulfillments: [
          {
            id: "of-1",
            orderId: "ord-1",
            warehouseId: "wh-1",
            quantityShipped: 15,
            shippingCostForThisSegment: 75,
            warehouse: {
              name: "Test Warehouse 1",
            },
          },
          {
            id: "of-2",
            orderId: "ord-1",
            warehouseId: "wh-2",
            quantityShipped: 5,
            shippingCostForThisSegment: 25,
            warehouse: {
              name: "Test Warehouse 2",
            },
          },
        ],
      };

      // Setup mock for findUnique
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(
        mockOrderWithFulfillments,
      );

      // Execute
      const result =
        await OrderRepository.getOrderByOrderNumber(mockOrderNumber);

      // Assertions
      expect(result).toEqual(mockOrderWithFulfillments);
      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { orderNumber: mockOrderNumber },
        include: {
          orderFulfillments: {
            include: {
              warehouse: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });
    });

    it("should return null when order is not found", async () => {
      const nonExistentOrderNumber = "NON-EXISTENT";

      // Setup mock to return null
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

      // Execute
      const result = await OrderRepository.getOrderByOrderNumber(
        nonExistentOrderNumber,
      );

      // Assertions
      expect(result).toBeNull();
      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { orderNumber: nonExistentOrderNumber },
        include: expect.any(Object),
      });
    });
  });

  describe("updateOrderStatus", () => {
    it("should update order status successfully", async () => {
      const mockOrderId = "ord-1";
      const newStatus = OrderStatus.PENDING;
      const updatedOrder = {
        id: mockOrderId,
        orderNumber: "01H6TZZTNSXRXM1FBWMCKNT0AY",
        customerLatitude: 41.8781,
        customerLongitude: -87.6298,
        quantityOrdered: 20,
        basePrice: 3000,
        discountPercentage: 5,
        priceAfterDiscount: 2850,
        totalShippingCost: 100,
        status: newStatus, // Updated status
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Setup mock
      (prisma.order.update as jest.Mock).mockResolvedValue(updatedOrder);

      // Execute
      const result = await OrderRepository.updateOrderStatus(
        mockOrderId,
        newStatus,
      );

      // Assertions
      expect(result).toEqual(updatedOrder);
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: mockOrderId },
        data: { status: newStatus },
      });
    });
  });
});
