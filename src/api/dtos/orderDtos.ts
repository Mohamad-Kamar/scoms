import { z } from "zod";
import { FulfillmentSegment } from "../../services/shippingService";

// Request DTO validation schema
export const OrderVerifyRequestSchema = z.object({
  quantity: z
    .number()
    .int({ message: "Quantity must be an integer." })
    .positive({ message: "Quantity must be greater than 0." }),
  shippingAddress: z.object({
    latitude: z
      .number()
      .min(-90, { message: "Latitude must be between -90 and 90." })
      .max(90, { message: "Latitude must be between -90 and 90." }),
    longitude: z
      .number()
      .min(-180, { message: "Longitude must be between -180 and 180." })
      .max(180, { message: "Longitude must be between -180 and 180." }),
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
}
