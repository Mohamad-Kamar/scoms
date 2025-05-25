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

1. **Install dependencies:**
   ```
   npm install
   ```

2. **Start PostgreSQL database:**
   ```
   docker-compose up -d
   ```

3. **Set up the database:**
   ```
   npx prisma migrate dev
   npm run prisma:seed
   ```

4. **Run the development server:**
   ```
   npm run dev
   ```

5. **Build for production:**
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

## API Documentation

API endpoints will be available at http://localhost:3000/ when the server is running.

### Available Endpoints

#### Verify Order
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

#### Submit Order
- **URL**: `/api/v1/orders`
- **Method**: `POST`
- **Request Body**: Same as verify order
- **Response**: Order confirmation with order number, or validation error message

## Testing
