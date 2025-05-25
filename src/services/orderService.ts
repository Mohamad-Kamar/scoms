import { Coordinates } from "../utils/geoUtils";
import { DiscountService } from "./discountService";
import { ShippingService, FulfillmentSegment } from "./shippingService";
import { WarehouseRepository } from "../repositories/warehouseRepository";
import { OrderRepository } from "../repositories/orderRepository";
import { SHIPPING } from "../config/constants";
import { OrderStatus } from "@prisma/client";

export interface OrderVerificationResult {
  totalPrice: number;
  discountPercentage: number;
  discountedPrice: number;
  shippingCost: number;
  isValid: boolean;
  fulfillmentPlan?: FulfillmentSegment[];
  invalidReason?: string;
}

export interface OrderSubmissionResult extends OrderVerificationResult {
  orderNumber: string;
}

/**
 * Service for handling order-related business logic
 */
export class OrderService {
  /**
   * Verify an order by calculating prices, discounts, and checking if it can be fulfilled
   * @param quantity The number of units to order
   * @param shippingAddress The customer's shipping address coordinates
   * @returns Order verification result with prices, discount, shipping details and validity
   */
  public static async verifyOrder(
    quantity: number,
    shippingAddress: Coordinates,
  ): Promise<OrderVerificationResult> {
    // Validate input
    if (quantity <= 0) {
      return {
        totalPrice: 0,
        discountPercentage: 0,
        discountedPrice: 0,
        shippingCost: 0,
        isValid: false,
        invalidReason: "Quantity must be greater than 0",
      };
    }

    // Get all warehouses to check stock and calculate shipping
    const warehouses = await WarehouseRepository.getAllWarehouses();

    // Calculate discounts
    const { discountPercentage, discountedPrice, basePrice } =
      DiscountService.calculateDiscount(quantity);

    // Determine optimal fulfillment plan
    const { fulfillmentPlan, totalShippingCost, sufficientStock } =
      ShippingService.determineOptimalFulfillment(
        quantity,
        shippingAddress,
        warehouses,
      );

    // Check if shipping cost is not higher than the maximum percentage allowed
    const maxAllowedShippingCost =
      (discountedPrice * SHIPPING.MAX_COST_PERCENTAGE) / 100;
    const shippingCostExceedsLimit = totalShippingCost > maxAllowedShippingCost;

    // Determine order validity
    const isValid = sufficientStock && !shippingCostExceedsLimit;

    // Build invalid reason if applicable
    let invalidReason: string | undefined;
    if (!sufficientStock) {
      invalidReason = "Insufficient stock across all warehouses";
    } else if (shippingCostExceedsLimit) {
      invalidReason = `Shipping cost exceeds ${SHIPPING.MAX_COST_PERCENTAGE}% of the order value`;
    }

    return {
      totalPrice: basePrice,
      discountPercentage,
      discountedPrice,
      shippingCost: totalShippingCost,
      isValid,
      fulfillmentPlan: isValid ? fulfillmentPlan : undefined,
      invalidReason,
    };
  }

  /**
   * Submit an order by verifying it and persisting to the database
   * @param quantity The number of units to order
   * @param shippingAddress The customer's shipping address coordinates
   * @returns Order submission result with order number if successful
   */
  public static async submitOrder(
    quantity: number,
    shippingAddress: Coordinates,
  ): Promise<OrderSubmissionResult> {
    // First verify the order
    const verificationResult = await this.verifyOrder(
      quantity,
      shippingAddress,
    );

    // If order is invalid, return early
    if (!verificationResult.isValid) {
      return {
        ...verificationResult,
        orderNumber: "", // Empty order number for invalid orders
      };
    }

    try {
      // Create the order using the OrderRepository
      const { orderNumber } = await OrderRepository.createOrder({
        customerCoordinates: shippingAddress,
        quantity: quantity,
        basePrice: verificationResult.totalPrice,
        discountPercentage: verificationResult.discountPercentage,
        discountedPrice: verificationResult.discountedPrice,
        shippingCost: verificationResult.shippingCost,
        fulfillmentPlan: verificationResult.fulfillmentPlan || [],
        status: OrderStatus.CONFIRMED,
      });

      // Return the result with order number
      return {
        ...verificationResult,
        orderNumber,
      };
    } catch (error) {
      console.error("Error submitting order:", error);
      throw new Error("Failed to submit order");
    }
  }
}
