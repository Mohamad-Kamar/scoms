import { calculateDistanceInKm, calculateShippingCost } from "../geoUtils";
import { SHIPPING } from "../../config/constants";

// Mock the geolib.getDistance function
jest.mock("geolib", () => ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getDistance: jest.fn().mockImplementation((point1, point2) => {
    // Mock a simple implementation that returns 10km (10000 meters) for testing
    return 10000;
  }),
}));

describe("GeoUtils", () => {
  describe("calculateDistanceInKm", () => {
    it("calculates distance between two points", () => {
      const point1 = { latitude: 52.5, longitude: 13.4 };
      const point2 = { latitude: 51.5, longitude: 7.4 };

      // Our mock will return 10km
      const distance = calculateDistanceInKm(point1, point2);
      expect(distance).toEqual(10);
    });
  });

  describe("calculateShippingCost", () => {
    it("calculates shipping cost based on distance and weight", () => {
      const point1 = { latitude: 52.5, longitude: 13.4 };
      const point2 = { latitude: 51.5, longitude: 7.4 };
      const weightKg = 5;

      // Our mock will return 10km distance
      // Expected cost = 10km * 5kg * RATE_PER_KG_PER_KM
      const expectedCost = 10 * weightKg * SHIPPING.RATE_PER_KG_PER_KM;

      const cost = calculateShippingCost(point1, point2, weightKg);
      expect(cost).toEqual(expectedCost);
    });
  });
});
