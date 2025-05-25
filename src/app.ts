import express, { Request, Response, NextFunction } from "express";
import apiRoutes from "./api/routes";

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    documentation: "/api-docs", // Will be implemented later
  });
});

// Error handling middleware
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);

  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message,
  });
});

export default app;
