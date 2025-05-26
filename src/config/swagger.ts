import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ScreenCloud Order Management System API",
      version: "1.0.0",
      description:
        "API for managing ScreenCloud device orders, handling warehouse inventory, and optimizing shipping logistics.\n\nThis API provides endpoints for verifying and submitting orders, calculating shipping costs, and managing warehouse stock levels.",
      contact: {
        name: "ScreenCloud Support",
        email: "support@screencloud.com",
        url: "https://screen.cloud/support",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
      {
        url: "https://api.example.com",
        description: "Production server (Example)",
      },
    ],
    tags: [
      {
        name: "Orders",
        description:
          "Order management endpoints for verifying and submitting orders",
      },
      {
        name: "Warehouses",
        description:
          "Warehouse management endpoints for inventory and stock levels",
      },
    ],
    components: {
      securitySchemes: {
        apiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-KEY",
          description: "API key for secure access to the API",
        },
      },
      schemas: {
        OrderVerifyRequest: {
          type: "object",
          required: ["quantity", "shippingAddress"],
          properties: {
            quantity: {
              type: "integer",
              minimum: 1,
              description: "Number of units to order",
              example: 10,
            },
            shippingAddress: {
              type: "object",
              required: ["latitude", "longitude"],
              properties: {
                latitude: {
                  type: "number",
                  minimum: -90,
                  maximum: 90,
                  description: "Shipping address latitude",
                  example: 40.7128,
                },
                longitude: {
                  type: "number",
                  minimum: -180,
                  maximum: 180,
                  description: "Shipping address longitude",
                  example: -74.006,
                },
              },
            },
          },
        },
        OrderVerifyResponse: {
          type: "object",
          properties: {
            totalPrice: {
              type: "number",
              description: "Total price before discount",
              example: 1500,
            },
            discountPercentage: {
              type: "number",
              description: "Applied discount percentage",
              example: 10,
            },
            discountedPrice: {
              type: "number",
              description: "Final price after discount",
              example: 1350,
            },
            shippingCost: {
              type: "number",
              description: "Calculated shipping cost",
              example: 50,
            },
            isValid: {
              type: "boolean",
              description: "Whether the order is valid",
              example: true,
            },
            fulfillmentPlan: {
              type: "array",
              items: {
                $ref: "#/components/schemas/FulfillmentSegment",
              },
            },
            invalidReason: {
              type: "string",
              description: "Reason for invalidity if applicable",
              example: "Insufficient stock",
            },
          },
        },
        FulfillmentSegment: {
          type: "object",
          properties: {
            warehouseId: {
              type: "string",
              description: "ID of the warehouse",
              example: "warehouse-123",
            },
            warehouseName: {
              type: "string",
              description: "Name of the warehouse",
              example: "New York Warehouse",
            },
            units: {
              type: "integer",
              description: "Number of units to fulfill from this warehouse",
              example: 5,
            },
            cost: {
              type: "number",
              description: "Shipping cost for this segment",
              example: 25,
            },
            distance: {
              type: "number",
              description: "Distance to the warehouse in km",
              example: 100,
            },
          },
        },
        ErrorResponse: {
          type: "object",
          required: ["error", "message"],
          properties: {
            error: {
              type: "string",
              description: "Error type or category",
              example: "ValidationError",
            },
            message: {
              type: "string",
              description: "Detailed error message",
              example: "Quantity must be greater than 0",
            },
            details: {
              type: "object",
              description: "Additional error details if available",
              example: {
                field: "quantity",
                constraint: "positive",
              },
            },
          },
        },
      },
      responses: {
        BadRequest: {
          description: "Invalid request data",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
              example: {
                error: "ValidationError",
                message: "Quantity must be greater than 0",
                details: {
                  field: "quantity",
                  constraint: "positive",
                },
              },
            },
          },
        },
        UnprocessableEntity: {
          description: "Business rule violation",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
              example: {
                error: "BusinessRuleViolation",
                message: "Insufficient stock available",
                details: {
                  warehouseId: "warehouse-123",
                  availableStock: 5,
                },
              },
            },
          },
        },
        InternalServerError: {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
              example: {
                error: "InternalServerError",
                message: "An unexpected error occurred",
              },
            },
          },
        },
      },
    },
  },
  apis: ["./src/api/routes/*.ts", "./src/api/controllers/*.ts"],
};

// Generate Swagger specification
const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
