import express, { Request, Response, NextFunction } from "express";
import apiRoutes from "./api/routes";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./config/swagger";
import logger from "./utils/logger";

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Register API routes
app.use(apiRoutes);

// Basic health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// Root endpoint for API documentation
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "ScreenCloud Order Management System API",
    version: "1.0.0",
    documentation: "/api-docs",
  });
});

// Centralized error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(`Error: ${err.message}\n${err.stack}`);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message || "An unexpected error occurred",
  });
});

export default app;
