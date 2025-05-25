import { getDistance } from "geolib";
import { SHIPPING } from "../config/constants";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two geographical points in kilometers
 */
export function calculateDistanceInKm(
  point1: Coordinates,
  point2: Coordinates,
): number {
  // getDistance returns distance in meters, convert to kilometers
  return getDistance(point1, point2) / 1000;
}

/**
 * Calculate shipping cost based on distance and weight
 */
export function calculateShippingCost(
  fromCoords: Coordinates,
  toCoords: Coordinates,
  weightKg: number,
): number {
  const distanceKm = calculateDistanceInKm(fromCoords, toCoords);
  return distanceKm * weightKg * SHIPPING.RATE_PER_KG_PER_KM;
}
