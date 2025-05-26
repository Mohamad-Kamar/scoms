# ScreenCloud Order Management System (SCOMS)

Backend system for managing ScreenCloud device orders, warehouse inventory, and shipping logistics.

## Project Structure

- `src/` - Source code
  - `api/` - API routes, controllers, and DTOs
  - `services/` - Business logic
  - `repositories/` - Data access layer
  - `utils/` - Helper functions
  - `config/` - Application configuration
- `prisma/` - Database schema and migrations
- `dist/` - Compiled output

## Requirements

- Node.js (v18+)
- npm or yarn
- Docker and Docker Compose (for PostgreSQL)

## Setup

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd scoms
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Create environment file:**
   ```
   cp .env.example .env
   ```
   Note: The default configuration should work for local development.

4. **Start PostgreSQL database:**
   ```
   docker-compose up -d
   ```

5. **Set up the database:**
   ```
   npx prisma migrate dev
   npm run prisma:seed
   ```

6. **Run the development server:**
   ```
   npm run dev
   ```

7. **Build for production:**
   ```
   npm run build
   npm start
   ```

## Database Administration

The project includes pgAdmin for database management:

1. Access pgAdmin at http://localhost:5050
2. Login with:
   - Email: admin@example.com
   - Password: admin
3. To connect to the PostgreSQL instance:
   - Right-click on "Servers" and select "Create" > "Server..."
   - Name: SCOMS
   - Connection tab:
     - Host name/address: postgres (the Docker service name)
     - Port: 5432
     - Maintenance database: scoms
     - Username: postgres
     - Password: postgres

## Testing

The project includes comprehensive testing tools:

```bash
# Run all tests
npm test

# Run unit tests only (services, repositories, utils)
npm run test:unit

# Run integration tests only (API routes)
npm run test:integration

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode for development
npm run test:watch
```

## API Documentation

API endpoints will be available at http://localhost:3000/ when the server is running.

For full API documentation, access Swagger UI at http://localhost:3000/api-docs

### Available Endpoints

##### Verify Order
- **URL**: `/api/v1/orders/verify`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "quantity": 30,
    "shippingAddress": {
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  }
  ```
- **Response**: Order verification details including validity, pricing, and fulfillment plan

##### Submit Order
- **URL**: `/api/v1/orders`
- **Method**: `POST`
- **Request Body**: Same as verify order
- **Response**: Order confirmation with order number, or validation error message

#### Warehouse Endpoints

##### Get All Warehouses
- **URL**: `/api/v1/warehouses`
- **Method**: `GET`
- **Response**: List of all warehouses with stock levels

##### Get Warehouse by ID
- **URL**: `/api/v1/warehouses/{id}`
- **Method**: `GET`
- **Response**: Details for a specific warehouse

## Testing

To run tests, use the following command:
```
npm test
```

### Testing Strategy
- **Unit Tests**: Focus on individual services and utilities (e.g., `DiscountService`, `ShippingService`).
- **Integration Tests**: Validate API endpoints and database interactions (e.g., `/api/v1/orders/verify`, `/api/v1/orders`).
- **Mocking**: External dependencies like `geolib` and database operations are mocked for isolated testing.

## Future Improvements

1. **Enhanced Error Handling**:
   - Implement more granular error codes and messages.
   - Add logging for better debugging and monitoring.

2. **Scalability**:
   - Introduce caching for frequently accessed data (e.g., warehouse stock levels).
   - Optimize database queries and indexing.

3. **Security**:
   - Add authentication and authorization for API endpoints.
   - Use environment variables for sensitive configurations.

4. **API Features**:
   - Add endpoints for updating and deleting orders.
   - Implement pagination for large datasets (e.g., order history).

## Design Choices

1. **Service-Oriented Architecture**:
   - Business logic is encapsulated in services (`OrderService`, `ShippingService`) for reusability and testability.

2. **Prisma ORM**:
   - Chosen for its type safety and ease of use with TypeScript.

3. **Validation with Zod**:
   - Ensures robust request validation with clear error messages.

4. **Swagger Documentation**:
   - Provides a user-friendly interface for exploring and testing the API.
