import { DiscountService } from "../discountService";
import { PRODUCT } from "../../config/constants";

describe("DiscountService", () => {
  describe("calculateDiscount", () => {
    it("throws an error when quantity is zero or negative", () => {
      expect(() => DiscountService.calculateDiscount(0)).toThrow(
        "Quantity must be greater than 0",
      );
      expect(() => DiscountService.calculateDiscount(-5)).toThrow(
        "Quantity must be greater than 0",
      );
    });

    it("calculates correct base price", () => {
      const result = DiscountService.calculateDiscount(10);
      expect(result.basePrice).toEqual(10 * PRODUCT.PRICE);
    });

    it("applies no discount for quantities below 25", () => {
      const result = DiscountService.calculateDiscount(24);
      expect(result.discountPercentage).toEqual(0);
      expect(result.discountedPrice).toEqual(24 * PRODUCT.PRICE);
    });

    it("applies 5% discount for quantities between 25 and 49", () => {
      const result = DiscountService.calculateDiscount(30);
      const basePrice = 30 * PRODUCT.PRICE;
      const expectedDiscount = 5;
      const expectedPrice = basePrice - (basePrice * expectedDiscount) / 100;

      expect(result.discountPercentage).toEqual(expectedDiscount);
      expect(result.discountedPrice).toEqual(expectedPrice);
    });

    it("applies 10% discount for quantities between 50 and 99", () => {
      const result = DiscountService.calculateDiscount(75);
      const basePrice = 75 * PRODUCT.PRICE;
      const expectedDiscount = 10;
      const expectedPrice = basePrice - (basePrice * expectedDiscount) / 100;

      expect(result.discountPercentage).toEqual(expectedDiscount);
      expect(result.discountedPrice).toEqual(expectedPrice);
    });

    it("applies 15% discount for quantities between 100 and 249", () => {
      const result = DiscountService.calculateDiscount(200);
      const basePrice = 200 * PRODUCT.PRICE;
      const expectedDiscount = 15;
      const expectedPrice = basePrice - (basePrice * expectedDiscount) / 100;

      expect(result.discountPercentage).toEqual(expectedDiscount);
      expect(result.discountedPrice).toEqual(expectedPrice);
    });

    it("applies 20% discount for quantities 250 and above", () => {
      const result = DiscountService.calculateDiscount(300);
      const basePrice = 300 * PRODUCT.PRICE;
      const expectedDiscount = 20;
      const expectedPrice = basePrice - (basePrice * expectedDiscount) / 100;

      expect(result.discountPercentage).toEqual(expectedDiscount);
      expect(result.discountedPrice).toEqual(expectedPrice);
    });
  });
});
