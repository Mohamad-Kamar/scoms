# ScreenCloud Order Management System (SCOMS) - Action Plan

This document outlines the development plan for the ScreenCloud Order Management System backend challenge.

## Phase 0: Setup & Foundation

1.  **Project Initialization:**
    *   [ ] Node.js project setup (`npm init -y`).
    *   [ ] TypeScript installation and configuration (`npm i -D typescript @types/node ts-node nodemon`, `npx tsc --init` then configure `tsconfig.json` with `rootDir`, `outDir`, `esModuleInterop: true`, `resolveJsonModule: true`, `sourceMap: true`, `strict: true`).
    *   [ ] Linter and Formatter setup (ESLint, Prettier - e.g., `npm i -D eslint prettier eslint-config-prettier eslint-plugin-prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin`, configure `.eslintrc.js`, `.prettierrc.json`).
    *   [ ] Establish core directory structure:
        *   `src/`
            *   `api/` (routes, controllers, request validation DTOs)
            *   `services/` (business logic)
            *   `repositories/` (data access layer)
            *   `models/` (or `entities/` - potentially for domain models if not fully covered by Prisma)
            *   `utils/` (helper functions)
            *   `config/` (application configuration, constants)
            *   `prisma/` (Prisma schema, migrations, seed)
            *   `app.ts` (Express app setup)
            *   `server.ts` (HTTP server start)
2.  **HTTP Server:**
    *   [ ] Integrate Express.js (`npm i express`, `npm i -D @types/express`).
    *   [ ] Basic "health check" or root endpoint (e.g., `GET /`).
3.  **Database Setup (PostgreSQL with Prisma):**
    *   [ ] Create `docker-compose.yml` for PostgreSQL service.
    *   [ ] Initialize Prisma: `npm i prisma @prisma/client`, `npx prisma init --datasource-provider postgresql`.
    *   [ ] Define Prisma schema (`prisma/schema.prisma`):
        *   `Warehouse` model (id, name, latitude, longitude, stock).
        *   `Order` model (id, orderNumber (ULID, unique), customerLatitude, customerLongitude, quantityOrdered, basePrice, discountPercentage, priceAfterDiscount, totalShippingCost, status (e.g., PENDING, CONFIRMED, INVALID), createdAt, updatedAt).
        *   `OrderFulfillment` model (id, orderId (FK), warehouseId (FK), quantityShipped, shippingCostForThisShipment).
    *   [ ] Create initial migration: `npx prisma migrate dev --name init`.
    *   [ ] Implement Prisma seed script (`prisma/seed.ts`) for warehouse data. Run with `npx prisma db seed`.
4.  **Core Utilities & Configuration:**
    *   [ ] ULID generation utility (`npm i ulid`).
    *   [ ] Geographical distance calculation utility (`npm i geolib`, `npm i -D @types/geolib`).
    *   [ ] Configuration management (`npm i dotenv`). Create `.env` file (and add to `.gitignore`).
    *   [ ] Define application constants (product details, discount tiers, shipping rate) in `src/config/constants.ts`.

## Phase 1: Core Logic & Verification Endpoint

1.  **Service Layer Implementation:**
    *   [ ] `DiscountService` (`src/services/discountService.ts`):
        *   `calculateDiscount(quantity: number): { discountPercentage: number, discountedPrice: number }`
    *   [ ] `ShippingService` (`src/services/shippingService.ts`):
        *   `calculateShippingCostForSegment(distanceKm: number, totalWeightKg: number): number`
        *   `determineOptimalFulfillment(quantity: number, customerCoords: { latitude: number, longitude: number }, warehouses: Warehouse[]): { fulfillmentPlan: FulfillmentSegment[], totalShippingCost: number, sufficientStock: boolean }`
            *   `FulfillmentSegment`: `{ warehouseId: string, warehouseName: string, units: number, cost: number }`
    *   [ ] `WarehouseRepository` (`src/repositories/warehouseRepository.ts`):
        *   `getAllWarehouses(): Promise<Warehouse[]>`
        *   (Stock update methods will be added in Phase 2)
    *   [ ] `PrismaClient` instance and setup (`src/config/db.ts` or similar).
2.  **Order Verification Logic (`OrderService.verifyOrder` - in `src/services/orderService.ts`):**
    *   [ ] Inputs: `quantity: number`, `shippingAddress: { latitude: number, longitude: number }`.
    *   [ ] Orchestrate calls to `DiscountService`, `WarehouseRepository`, and `ShippingService`.
    *   [ ] Calculate total base price, apply discount.
    *   [ ] Determine fulfillment plan and total shipping cost.
    *   [ ] Check the 15% shipping cost validity rule.
    *   [ ] Return a structured DTO: `{ totalPrice: number, discountApplied: number, finalPrice: number, shippingCost: number, isValid: boolean, fulfillmentPlan?: FulfillmentSegment[] }`.
3.  **API Endpoint (`POST /api/v1/orders/verify`):**
    *   [ ] Define request DTO and validation (e.g., using Zod: `npm i zod`).
    *   [ ] Create controller (`src/api/controllers/orderController.ts`) and route (`src/api/routes/orderRoutes.ts`).
    *   [ ] Route handler in Express, calling `OrderService.verifyOrder`.
    *   [ ] Format and send the response.
4.  **Unit & Integration Testing (Initial):**
    *   [ ] Setup Jest (`npm i -D jest ts-jest @types/jest`). Configure `jest.config.js`.
    *   [ ] Unit tests for `DiscountService`, Haversine utility, `calculateShippingCostForSegment`.
    *   [ ] Basic integration test for the `/api/v1/orders/verify` endpoint (happy path) using `supertest` (`npm i -D supertest @types/supertest`).

## Phase 2: Order Submission & Persistence

1.  **Order Submission Logic (`OrderService.submitOrder`):**
    *   [ ] Inputs: `quantity: number`, `shippingAddress: { latitude: number, longitude: number }`.
    *   [ ] Reuse verification logic (or parts of it) to determine costs, fulfillment plan, and validity.
    *   [ ] If invalid or insufficient global stock (from `determineOptimalFulfillment`), return an appropriate error.
    *   [ ] **Database Transaction (using `prisma.$transaction`):**
        1.  Generate ULID for `orderNumber`.
        2.  Create `Order` record.
        3.  For each segment in the fulfillment plan:
            *   Create `OrderFulfillment` record.
            *   Atomically decrement stock in the corresponding `Warehouse` record. Ensure stock check (`WHERE stock >= unitsShipped`) or handle Prisma errors for insufficient stock.
    *   [ ] Return a success DTO: `{ orderNumber: string, totalPrice: number, discountApplied: number, finalPrice: number, shippingCost: number, fulfillmentPlan: FulfillmentSegment[] }`.
2.  **API Endpoint (`POST /api/v1/orders`):**
    *   [ ] Define request DTO and validation (can reuse verification DTO).
    *   [ ] Add route handler in `OrderController` and `orderRoutes.ts`.
    *   [ ] Call `OrderService.submitOrder`.
    *   [ ] Return 201 Created on success, or appropriate error codes (400, 422 for business rule violations like out of stock, 500).
3.  **Integration Testing (Continued):**
    *   [ ] Integration test for `/api/v1/orders` (happy path: check DB records created, stock updated).
    *   [ ] Test case for order submission failure (e.g., insufficient stock during transaction).

## Phase 3: Documentation, Polish & Final Review

1.  **API Documentation:**
    *   [ ] Write/generate OpenAPI (Swagger) specification (e.g., using `swagger-jsdoc` and `swagger-ui-express`) or a detailed API documentation section in `README.md`.
2.  **README.md:**
    *   [ ] Project overview.
    *   [ ] Detailed setup and run instructions (Docker, Prisma migrations, seeding, `npm run dev`, `npm start`, `npm test`).
    *   [ ] Explanation of design choices and trade-offs.
    *   [ ] Overview of the testing strategy.
    *   [ ] **Crucial: "What I Would Do Next / Future Improvements" section.**
3.  **Code Review & Cleanup:**
    *   [ ] Ensure code is clean, well-commented where necessary.
    *   [ ] Verify all requirements are met.
    *   [ ] Final check of local startup and test execution.
4.  **Centralized Error Handling:**
    *   [ ] Implement a basic error handling middleware in Express for consistent API error responses.
    *   [ ] Define custom error classes if needed for specific business logic errors.
5.  **Scripts:**
    *   [ ] Add `npm` scripts to `package.json` for `build`, `start`, `dev`, `test`, `lint`, `prisma:migrate`, `prisma:seed`, etc.
