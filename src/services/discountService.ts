import { DISCOUNT_TIERS, PRODUCT } from "../config/constants";

export interface DiscountResult {
  discountPercentage: number;
  discountedPrice: number;
  basePrice: number;
}

/**
 * Service for calculating discounts based on order quantity
 */
export class DiscountService {
  /**
   * Calculate discount for a given quantity
   * @param quantity The number of units ordered
   * @returns Object containing discount percentage and the final discounted price
   */
  public static calculateDiscount(quantity: number): DiscountResult {
    if (quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    // Calculate base price
    const basePrice = quantity * PRODUCT.PRICE;

    // Find applicable discount tier
    const applicableTier = DISCOUNT_TIERS.find(
      (tier) => quantity >= tier.minQuantity,
    );
    const discountPercentage = applicableTier?.percentage || 0;

    // Calculate discounted price
    const discountAmount = (basePrice * discountPercentage) / 100;
    const discountedPrice = basePrice - discountAmount;

    return {
      discountPercentage,
      discountedPrice,
      basePrice,
    };
  }
}
