import { Request, Response } from "express";
import { OrderService } from "../../services/orderService";
import {
  OrderVerifyRequest,
  OrderVerifyRequestSchema,
} from "../dtos/orderDtos";
import { ZodError } from "zod";

export class OrderController {
  /**
   * Verify an order - checks price, discount, shipping, and order validity
   */
  public static async verifyOrder(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const data = OrderVerifyRequestSchema.parse(
        req.body,
      ) as OrderVerifyRequest;

      // Process the verification
      const result = await OrderService.verifyOrder(
        data.quantity,
        data.shippingAddress,
      );

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        // Handle validation errors
        res.status(400).json({
          error: "Validation Error",
          message: "Invalid request data",
          details: error.flatten().fieldErrors,
        });
      } else {
        // Handle other errors
        console.error("Error in verifyOrder:", error);
        res.status(500).json({
          error: "Internal Server Error",
          message:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred",
        });
      }
    }
  }

  /**
   * Submit a new order - creates the order and updates warehouse inventory
   */
  public static async submitOrder(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body (same schema as verify)
      const data = OrderVerifyRequestSchema.parse(
        req.body,
      ) as OrderVerifyRequest;

      // Process the order submission
      const result = await OrderService.submitOrder(
        data.quantity,
        data.shippingAddress,
      );

      if (!result.isValid) {
        res.status(422).json({
          error: "Invalid Order",
          message: result.invalidReason || "Order validation failed",
        });
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        // Handle validation errors
        res.status(400).json({
          error: "Validation Error",
          message: "Invalid request data",
          details: error.flatten().fieldErrors,
        });
      } else {
        // Handle other errors
        console.error("Error in submitOrder:", error);
        res.status(500).json({
          error: "Internal Server Error",
          message:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred",
        });
      }
    }
  }
}
