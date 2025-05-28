// src/config/test-db.ts
import { PrismaClient } from "@prisma/client";

// Create a test-specific PrismaClient instance
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
  log: ["error"],
});

export default prisma;
