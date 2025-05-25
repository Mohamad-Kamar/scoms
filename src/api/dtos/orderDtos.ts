import { z } from "zod";
import { FulfillmentSegment } from "../../services/shippingService";

// Request DTO validation schema
export const OrderVerifyRequestSchema = z.object({
  quantity: z.number().int().positive(),
  shippingAddress: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
});

// Type derived from the validation schema
export type OrderVerifyRequest = z.infer<typeof OrderVerifyRequestSchema>;

// Response DTO type
export interface OrderVerifyResponse {
  totalPrice: number;
  discountPercentage: number;
  discountedPrice: number;
  shippingCost: number;
  isValid: boolean;
  fulfillmentPlan?: FulfillmentSegment[];
  invalidReason?: string;
}

// Error response DTO type
export interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, string[]>;
}
