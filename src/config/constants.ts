export const PRODUCT = {
  NAME: "SCOS Station P1 Pro",
  PRICE: 150, // in USD
  WEIGHT: 0.365, // in kg
};

export const DISCOUNT_TIERS = [
  { minQuantity: 250, percentage: 20 },
  { minQuantity: 100, percentage: 15 },
  { minQuantity: 50, percentage: 10 },
  { minQuantity: 25, percentage: 5 },
  { minQuantity: 0, percentage: 0 },
];

export const SHIPPING = {
  RATE_PER_KG_PER_KM: 0.01, // in USD
  MAX_COST_PERCENTAGE: 15, // maximum shipping cost as percentage of order value
};
