# ScreenCloud Order Management System (SCOMS)

Backend system for managing ScreenCloud device orders, warehouse inventory, and shipping logistics.

## Requirements

- Node.js (v18+)
- npm or yarn
- Docker and Docker Compose (for PostgreSQL)

## Getting Started

1. **Clone the repository and install dependencies:**
   ```bash
   git clone <repository-url>
   cd scoms
   npm install
   cp .env.example .env
   ```
2. **Start the database:**
   ```bash
   docker-compose up -d
   ```
3. **Set up the database and seed data:**
   ```bash
   npx prisma migrate dev
   npm run prisma:seed
   ```
4. **Run the server:**
   ```bash
   npm run dev
   # or for production
   npm run build && npm start
   ```
5. **API Documentation:**
   - Visit [http://localhost:3000/api-docs](http://localhost:3000/api-docs) for Swagger UI.

## Continuous Integration

This project uses GitHub Actions for CI. On every push and pull request to `main`/`master`, the workflow:
- Installs dependencies
- Sets up a PostgreSQL service
- Runs Prisma migrations and seeds the database
- Lints the code
- Runs all tests and uploads a coverage report

You can view workflow runs and logs in the "Actions" tab on GitHub.

## Project Structure

- `src/` - Source code
  - `api/` - API routes, controllers, and DTOs
  - `services/` - Business logic
  - `repositories/` - Data access layer
  - `utils/` - Helper functions
  - `config/` - Application configuration
- `prisma/` - Database schema and migrations
- `dist/` - Compiled output

## Database Administration

- pgAdmin is available at [http://localhost:5050](http://localhost:5050)
  - Email: admin@example.com
  - Password: admin
  - Host: postgres (Docker service name)
  - Port: 5432
  - Database: scoms
  - Username: postgres
  - Password: postgres

## Testing

Run tests with:
```bash
npm test                # All tests
npm run test:unit       # Unit tests (services, repositories, utils)
npm run test:integration # Integration tests (API routes)
npm run test:coverage   # Coverage report
npm run test:watch      # Watch mode
```
- **Unit Tests:** Focus on services/utilities (e.g., `DiscountService`, `ShippingService`).
- **Integration Tests:** Validate API endpoints and DB interactions (e.g., `/api/v1/orders/verify`).
- **Mocking:** External dependencies (e.g., geolib, DB) are mocked for isolation.
- **Coverage:** Run `npm run test:coverage` and view `coverage/lcov-report/index.html`.
- **Edge Cases:** Both valid and invalid scenarios are tested (e.g., insufficient stock, invalid input).

## API Documentation

- All endpoints are documented in Swagger UI: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- Example requests:
  - **Verify Order:**
    ```bash
    curl -X POST http://localhost:3000/api/v1/orders/verify \
      -H 'Content-Type: application/json' \
      -d '{"quantity": 30, "shippingAddress": {"latitude": 40.7128, "longitude": -74.0060}}'
    ```
  - **Submit Order:**
    ```bash
    curl -X POST http://localhost:3000/api/v1/orders \
      -H 'Content-Type: application/json' \
      -d '{"quantity": 30, "shippingAddress": {"latitude": 40.7128, "longitude": -74.0060}}'
    ```
  - **Get All Warehouses:**
    ```bash
    curl http://localhost:3000/api/v1/warehouses
    ```
  - **Get Warehouse by ID:**
    ```bash
    curl http://localhost:3000/api/v1/warehouses/<warehouseId>
    ```
- **Error Handling:** All endpoints return structured error responses, e.g.:
  ```json
  { "error": "ValidationError", "message": "Quantity must be greater than 0" }
  ```

## Troubleshooting
- Ensure Docker is running and the `postgres` service is healthy if you see DB connection errors.
- If migrations fail, try `docker-compose down -v` to reset volumes, then repeat setup.
- For Prisma errors, check your `.env` file and DB status.

## Implementation Status (Plan)

- **Phase 0: Setup & Foundation**: Complete
- **Phase 1: Core Logic & Verification Endpoint**: Complete
- **Phase 2: Order Submission & Persistence**: Complete
- **Phase 3: Warehouse API & Testing**: Complete

See `PLAN.md` for details. All major requirements from `Requirements.md` are implemented:
- Typescript, database-backed, well-documented API, clear testing strategy, and extensible architecture.

## Future Improvements
- Enhanced error handling and logging
- Caching and query optimization for scalability
- Authentication/authorization
- More API features (update/delete orders, pagination)

## Design Choices
- **Service-Oriented Architecture**: Business logic in services for reusability/testability
- **Prisma ORM**: Type safety and ease of use
- **Validation with Zod**: Robust request validation
- **Swagger**: User-friendly API docs

## Extensibility
- Add endpoints by creating new controllers/routes in `src/api/` and registering in `src/api/routes/index.ts`
- Add business rules in the relevant service (e.g., `OrderService`)
- Authentication can be added using middleware and Swagger security schemes
