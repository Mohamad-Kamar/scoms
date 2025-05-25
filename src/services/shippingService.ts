import { PRODUCT, SHIPPING } from "../config/constants";
import { Warehouse } from "@prisma/client";
import { calculateDistanceInKm, Coordinates } from "../utils/geoUtils";

export interface FulfillmentSegment {
  warehouseId: string;
  warehouseName: string;
  units: number;
  cost: number;
  distance: number;
}

export interface OptimalFulfillmentResult {
  fulfillmentPlan: FulfillmentSegment[];
  totalShippingCost: number;
  sufficientStock: boolean;
}

/**
 * Service for calculating shipping costs and determining optimal fulfillment strategy
 */
export class ShippingService {
  /**
   * Calculate shipping cost for a specific segment based on distance and weight
   * @param distanceKm Distance in kilometers
   * @param totalWeightKg Total weight in kilograms
   * @returns Shipping cost in USD
   */
  public static calculateShippingCostForSegment(
    distanceKm: number,
    totalWeightKg: number,
  ): number {
    // Validate inputs
    if (distanceKm < 0) {
      throw new Error("Distance cannot be negative");
    }

    if (totalWeightKg < 0) {
      throw new Error("Weight cannot be negative");
    }

    return distanceKm * totalWeightKg * SHIPPING.RATE_PER_KG_PER_KM;
  }

  /**
   * Determine the optimal fulfillment plan by selecting warehouses in order of proximity
   * to minimize shipping costs
   * @param quantity Total units to ship
   * @param customerCoords Customer's geographical coordinates
   * @param warehouses Available warehouses with current stock
   * @returns Fulfillment plan with cost breakdown and stock availability
   */
  public static determineOptimalFulfillment(
    quantity: number,
    customerCoords: Coordinates,
    warehouses: Warehouse[],
  ): OptimalFulfillmentResult {
    if (quantity <= 0 || !warehouses.length) {
      return {
        fulfillmentPlan: [],
        totalShippingCost: 0,
        sufficientStock: quantity === 0, // Zero quantity is technically fulfillable
      };
    }

    // Calculate distance from customer to each warehouse and sort by proximity
    const warehousesWithDistance = warehouses
      .map((warehouse) => {
        const distance = calculateDistanceInKm(customerCoords, {
          latitude: warehouse.latitude,
          longitude: warehouse.longitude,
        });
        return { ...warehouse, distance };
      })
      .sort((a, b) => a.distance - b.distance);

    const fulfillmentPlan: FulfillmentSegment[] = [];
    let remainingQuantity = quantity;
    let totalShippingCost = 0;

    // Allocate orders to warehouses in order of proximity
    for (const warehouse of warehousesWithDistance) {
      if (remainingQuantity <= 0) break;

      // Determine how many units this warehouse can fulfill
      const unitsFromThisWarehouse = Math.min(
        warehouse.stock,
        remainingQuantity,
      );

      if (unitsFromThisWarehouse > 0) {
        // Calculate shipping cost for this segment
        const segmentWeight = unitsFromThisWarehouse * PRODUCT.WEIGHT;
        const segmentShippingCost = this.calculateShippingCostForSegment(
          warehouse.distance,
          segmentWeight,
        );

        // Add to fulfillment plan
        fulfillmentPlan.push({
          warehouseId: warehouse.id,
          warehouseName: warehouse.name,
          units: unitsFromThisWarehouse,
          cost: segmentShippingCost,
          distance: warehouse.distance,
        });

        totalShippingCost += segmentShippingCost;
        remainingQuantity -= unitsFromThisWarehouse;
      }
    }

    // Check if we have sufficient stock across all warehouses
    const sufficientStock = remainingQuantity === 0;

    return {
      fulfillmentPlan,
      totalShippingCost,
      sufficientStock,
    };
  }
}
