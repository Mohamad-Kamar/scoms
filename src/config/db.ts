import { PrismaClient } from "@prisma/client";

// Create a singleton instance of PrismaClient
const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

// Handle potential connection errors
prisma
  .$connect()
  .then(() => {
    console.log("Connected to database successfully");
  })
  .catch((error) => {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  });

// Handle cleanup on application shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
  console.log("Disconnected from database");
});

export default prisma;
