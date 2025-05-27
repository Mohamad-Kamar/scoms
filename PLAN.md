# ScreenCloud Order Management System (SCOMS) - Action Plan

This document outlines the development plan for the ScreenCloud Order Management System backend challenge.

## Phase 0: Setup & Foundation ✅

1.  **Project Initialization:**
    *   [x] Node.js project setup (`npm init -y`).
    *   [x] TypeScript installation and configuration (`npm i -D typescript @types/node ts-node nodemon`, `npx tsc --init` then configure `tsconfig.json` with `rootDir`, `outDir`, `esModuleInterop: true`, `resolveJsonModule: true`, `sourceMap: true`, `strict: true`).
    *   [x] Linter and Formatter setup (ESLint, Prettier - e.g., `npm i -D eslint prettier eslint-config-prettier eslint-plugin-prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin`, configure `.eslintrc.js`, `.prettierrc.json`).
    *   [x] Establish core directory structure:
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
    *   [x] Integrate Express.js (`npm i express`, `npm i -D @types/express`).
    *   [x] Basic "health check" or root endpoint (e.g., `GET /`).
3.  **Database Setup (PostgreSQL with Prisma):**
    *   [x] Create `docker-compose.yml` for PostgreSQL service.
    *   [x] Initialize Prisma: `npm i prisma @prisma/client`, `npx prisma init --datasource-provider postgresql`.
    *   [x] Define Prisma schema (`prisma/schema.prisma`):
        *   `Warehouse` model (id, name, latitude, longitude, stock).
        *   `Order` model (id, orderNumber (ULID, unique), customerLatitude, customerLongitude, quantityOrdered, basePrice, discountPercentage, priceAfterDiscount, totalShippingCost, status (e.g., PENDING, CONFIRMED, INVALID), createdAt, updatedAt).
        *   `OrderFulfillment` model (id, orderId (FK), warehouseId (FK), quantityShipped, shippingCostForThisShipment).
    *   [x] Create initial migration: `npx prisma migrate dev --name init`.
    *   [x] Implement Prisma seed script (`prisma/seed.ts`) for warehouse data. Run with `npx prisma db seed`.
4.  **Core Utilities & Configuration:**
    *   [x] ULID generation utility (`npm i ulid`).
    *   [x] Geographical distance calculation utility (`npm i geolib`, `npm i -D @types/geolib`).
    *   [x] Configuration management (`npm i dotenv`). Create `.env` file (and add to `.gitignore`).
    *   [x] Define application constants (product details, discount tiers, shipping rate) in `src/config/constants.ts`.

## Phase 1: Core Logic & Verification Endpoint ✅

1.  **Service Layer Implementation:**
    *   [x] `DiscountService` (`src/services/discountService.ts`):
        *   `calculateDiscount(quantity: number): { discountPercentage: number, discountedPrice: number }`
    *   [x] `ShippingService` (`src/services/shippingService.ts`):
        *   `calculateShippingCostForSegment(distanceKm: number, totalWeightKg: number): number`
        *   `determineOptimalFulfillment(quantity: number, customerCoords: { latitude: number, longitude: number }, warehouses: Warehouse[]): { fulfillmentPlan: FulfillmentSegment[], totalShippingCost: number, sufficientStock: boolean }`
            *   `FulfillmentSegment`: `{ warehouseId: string, warehouseName: string, units: number, cost: number }`
    *   [x] `WarehouseRepository` (`src/repositories/warehouseRepository.ts`):
        *   `getAllWarehouses(): Promise<Warehouse[]>`
        *   (Stock update methods will be added in Phase 2)
    *   [x] `PrismaClient` instance and setup (`src/config/db.ts` or similar).
2.  **Order Verification Logic (`OrderService.verifyOrder` - in `src/services/orderService.ts`):**
    *   [x] Inputs: `quantity: number`, `shippingAddress: { latitude: number, longitude: number }`.
    *   [x] Orchestrate calls to `DiscountService`, `WarehouseRepository`, and `ShippingService`.
    *   [x] Calculate total base price, apply discount.
    *   [x] Determine fulfillment plan and total shipping cost.
    *   [x] Check the 15% shipping cost validity rule.
    *   [x] Return a structured DTO: `{ totalPrice: number, discountApplied: number, finalPrice: number, shippingCost: number, isValid: boolean, fulfillmentPlan?: FulfillmentSegment[] }`.
3.  **API Endpoint (`POST /api/v1/orders/verify`):**
    *   [x] Define request DTO and validation (e.g., using Zod: `npm i zod`).
    *   [x] Create controller (`src/api/controllers/orderController.ts`) and route (`src/api/routes/orderRoutes.ts`).
    *   [x] Route handler in Express, calling `OrderService.verifyOrder`.
    *   [x] Format and send the response.
4.  **Unit & Integration Testing (Initial):**
    *   [x] Setup Jest (`npm i -D jest ts-jest @types/jest`). Configure `jest.config.js`.
    *   [x] Unit tests for `DiscountService`, Haversine utility, `calculateShippingCostForSegment`.
    *   [x] Basic integration test for the `/api/v1/orders/verify` endpoint (happy path) using `supertest` (`npm i -D supertest @types/supertest`).

## Phase 2: Order Submission & Persistence ✅

1.  **Order Submission Logic (`OrderService.submitOrder`):**
    *   [x] Inputs: `quantity: number`, `shippingAddress: { latitude: number, longitude: number }`.
    *   [x] Reuse verification logic (or parts of it) to determine costs, fulfillment plan, and validity.
    *   [x] If invalid or insufficient global stock (from `determineOptimalFulfillment`), return an appropriate error.
    *   [x] **Database Transaction (using `prisma.$transaction`):**
        1.  Generate ULID for `orderNumber`.
        2.  Create `Order` record.
        3.  For each segment in the fulfillment plan:
            *   Create `OrderFulfillment` record.
            *   Atomically decrement stock in the corresponding `Warehouse` record. Ensure stock check (`WHERE stock >= unitsShipped`) or handle Prisma errors for insufficient stock.
    *   [x] Return a success DTO: `{ orderNumber: string, totalPrice: number, discountApplied: number, finalPrice: number, shippingCost: number, fulfillmentPlan: FulfillmentSegment[] }`.
2.  **API Endpoint (`POST /api/v1/orders`):**
    *   [x] Define request DTO and validation (can reuse verification DTO).
    *   [x] Add route handler in `OrderController` and `orderRoutes.ts`.
    *   [x] Call `OrderService.submitOrder`.
    *   [x] Return 201 Created on success, or appropriate error codes (400, 422 for business rule violations like out of stock, 500).
3.  **Integration Testing (Continued):**
    *   [x] Integration test for `/api/v1/orders` (happy path: check DB records created, stock updated).
    *   [x] Test case for order submission failure (e.g., insufficient stock during transaction).

## Phase 3: Documentation, Polish & Final Review ✅

1.  **API Documentation:**
    *   [x] Write/generate OpenAPI (Swagger) specification (e.g., using `swagger-jsdoc` and `swagger-ui-express`) or a detailed API documentation section in `README.md`.
2.  **README.md:**
    *   [x] Project overview.
    *   [x] Detailed setup and run instructions (Docker, Prisma migrations, seeding, `npm run dev`, `npm start`, `npm test`).
    *   [x] Explanation of design choices and trade-offs.
    *   [x] Overview of the testing strategy.
    *   [x] **Crucial: "What I Would Do Next / Future Improvements" section.**
3.  **Code Review & Cleanup:**
    *   [x] Ensure code is clean, well-commented where necessary.
    *   [x] Verify all requirements are met.
    *   [x] Final check of local startup and test execution.
4.  **Centralized Error Handling:**
    *   [x] Implement a basic error handling middleware in Express for consistent API error responses.
    *   [x] Define custom error classes if needed for specific business logic errors.
5.  **Scripts:**
    *   [x] Add `npm` scripts to `package.json` for `build`, `start`, `dev`, `test`, `lint`, `prisma:migrate`, `prisma:seed`, etc.

## Phase 4: Production Deployment & Further Improvements

1.  **Cloud Deployment:**
    *   [ ] Deploy the application to a cloud provider (AWS, Azure, or GCP).
    *   [x] Set up CI/CD pipeline using GitHub Actions or similar service.
    *   [ ] Configure production environment variables and secrets management.
    *   [ ] Implement automated database migrations in deployment pipeline.

2.  **Performance Optimization:**
    *   [ ] Add database indexes for frequently queried fields.
    *   [ ] Implement database connection pooling for improved performance.
    *   [ ] Add performance benchmarks to measure system capacity.

3.  **Enhanced Testing Strategy:**
    *   [ ] Add edge-case tests for order validation and warehouse stock management.
    *   [ ] Implement load testing to validate system scalability.
    *   [ ] Expand unit test coverage for critical business logic components.

4.  **API Documentation Enhancements:**
    *   [ ] Add more comprehensive real-world example scenarios to Swagger documentation.
    *   [ ] Improve error documentation for each endpoint.
    *   [ ] Create postman/insomnia collections for API exploration.
    *   [ ] Provide code examples for API consumption in various languages.

5.  **Schema Validation Improvements:**
    *   [ ] Strengthen validation for edge cases like extreme coordinates.
    *   [ ] Add business rule validations for very large orders.
    *   [ ] Implement more detailed error responses for validation failures.
    *   [ ] Add validation for partial order scenarios.
