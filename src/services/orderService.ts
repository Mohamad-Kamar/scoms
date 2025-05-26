import { Coordinates } from "../utils/geoUtils";
import { DiscountService } from "./discountService";
import { ShippingService, FulfillmentSegment } from "./shippingService";
import { WarehouseRepository } from "../repositories/warehouseRepository";
import { OrderRepository } from "../repositories/orderRepository";
import { SHIPPING } from "../config/constants";
import { OrderStatus } from "@prisma/client";
import logger from "../utils/logger";

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
      invalidReason = "Shipping cost exceeds maximum percentage of order value";
    }

    // We'll keep these logs for development and production, but they'll be suppressed in tests
    logger.debug(`Sufficient stock: ${sufficientStock}`);
    logger.debug(`Shipping cost exceeds limit: ${shippingCostExceedsLimit}`);
    logger.debug(`Invalid reason before return: ${invalidReason}`);

    // Only use these additional logs when troubleshooting specific issues
    if (process.env.DEBUG_VERBOSE === "true") {
      logger.debug(`Base price: ${basePrice}`);
      logger.debug(`Discounted price: ${discountedPrice}`);
      logger.debug(`Total shipping cost: ${totalShippingCost}`);
      logger.debug(`Sufficient stock: ${sufficientStock}`);
      logger.debug(`Shipping cost exceeds limit: ${shippingCostExceedsLimit}`);
      logger.debug(`Final isValid: ${isValid}`);
      logger.debug(`Invalid reason: ${invalidReason}`);
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
      logger.error(
        `Error submitting order: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new Error("Failed to submit order");
    }
  }
}
