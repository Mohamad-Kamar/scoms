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
   npx prisma db seed
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

## API Documentation

API endpoints will be available at http://localhost:3000/ when the server is running.

## Testing
