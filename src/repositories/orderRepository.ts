import { Order, OrderStatus } from "@prisma/client";
import prisma from "../config/db";
import { ulid } from "ulid";
import { Coordinates } from "../utils/geoUtils";
import { FulfillmentSegment } from "../services/shippingService";

interface CreateOrderData {
  customerCoordinates: Coordinates;
  quantity: number;
  basePrice: number;
  discountPercentage: number;
  discountedPrice: number;
  shippingCost: number;
  fulfillmentPlan: FulfillmentSegment[];
  status?: OrderStatus;
}

interface OrderWithFulfillments extends Order {
  orderFulfillments: {
    id: string;
    warehouseId: string;
    quantityShipped: number;
    shippingCostForThisSegment: number;
    warehouse: {
      name: string;
    };
  }[];
}

/**
 * Repository for order-related database operations
 */
export class OrderRepository {
  /**
   * Create a new order with its fulfillment details
   * @param data Order data including customer coordinates, pricing and fulfillment plan
   * @returns The created order
   */
  public static async createOrder(
    data: CreateOrderData,
  ): Promise<{ orderId: string; orderNumber: string }> {
    const orderNumber = ulid();

    return await prisma.$transaction(async (tx) => {
      // Get all warehouses first to avoid querying repeatedly
      const warehouses = await tx.warehouse.findMany();

      // Verify warehouses exist and have enough stock before proceeding
      for (const segment of data.fulfillmentPlan) {
        // Find the warehouse in our warehouse list
        const warehouse = warehouses.find((w) => w.id === segment.warehouseId);

        if (!warehouse) {
          // If the exact warehouse ID is not found, let's try to find one by name
          // This helps if warehouse IDs changed between test runs
          const warehouseByName = warehouses.find(
            (w) => w.name === segment.warehouseName,
          );
          if (warehouseByName) {
            // Update the segment with the correct warehouse ID
            segment.warehouseId = warehouseByName.id;

            if (warehouseByName.stock < segment.units) {
              throw new Error(
                `Insufficient stock in warehouse ${warehouseByName.name}`,
              );
            }
          } else {
            throw new Error(
              `Warehouse with ID ${segment.warehouseId} not found and no warehouse with name ${segment.warehouseName} found`,
            );
          }
        } else if (warehouse.stock < segment.units) {
          throw new Error(`Insufficient stock in warehouse ${warehouse.name}`);
        }
      }

      // Create the order
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerLatitude: data.customerCoordinates.latitude,
          customerLongitude: data.customerCoordinates.longitude,
          quantityOrdered: data.quantity,
          basePrice: data.basePrice,
          discountPercentage: data.discountPercentage,
          priceAfterDiscount: data.discountedPrice,
          totalShippingCost: data.shippingCost,
          status: data.status || OrderStatus.CONFIRMED,
        },
      });

      // Create order fulfillments and update warehouse stock
      for (const segment of data.fulfillmentPlan) {
        // Create fulfillment record
        await tx.orderFulfillment.create({
          data: {
            orderId: order.id,
            warehouseId: segment.warehouseId,
            quantityShipped: segment.units,
            shippingCostForThisSegment: segment.cost,
          },
        });

        // Update warehouse stock
        await tx.warehouse.update({
          where: { id: segment.warehouseId },
          data: {
            stock: {
              decrement: segment.units,
            },
          },
        });
      }

      return { orderId: order.id, orderNumber };
    });
  }

  /**
   * Get an order by its order number including all fulfillment details
   * @param orderNumber The unique order number
   * @returns The order with fulfillment details or null if not found
   */
  public static async getOrderByOrderNumber(
    orderNumber: string,
  ): Promise<OrderWithFulfillments | null> {
    return await prisma.order.findUnique({
      where: { orderNumber },
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
  }

  /**
   * Update the status of an order
   * @param orderId The order ID
   * @param status The new status
   * @returns The updated order
   */
  public static async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<Order> {
    return await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }
}
