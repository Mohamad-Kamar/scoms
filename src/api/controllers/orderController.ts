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
        const fieldErrors = error.flatten().fieldErrors;
        const firstError =
          Object.values(fieldErrors)[0]?.[0] || "Invalid request data";
        res.status(400).json({
          error: "Validation Error",
          message: firstError,
          details: fieldErrors,
        });
      } else if (error instanceof Error) {
        // Handle other errors
        res.status(500).json({
          error: "Internal Server Error",
          message: error.message,
        });
      } else {
        res.status(500).json({
          error: "Unknown Error",
          message: "An unknown error occurred",
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
        const fieldErrors = error.flatten().fieldErrors;
        const firstError =
          Object.values(fieldErrors)[0]?.[0] || "Invalid request data";
        res.status(400).json({
          error: "Validation Error",
          message: firstError,
          details: fieldErrors,
        });
      } else if (error instanceof Error) {
        // Handle other errors
        res.status(500).json({
          error: "Internal Server Error",
          message: error.message,
        });
      } else {
        res.status(500).json({
          error: "Unknown Error",
          message: "An unknown error occurred",
        });
      }
    }
  }
}
