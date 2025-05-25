import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.orderFulfillment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.warehouse.deleteMany();

  // Seed warehouses
  const warehouses = [
    {
      name: "Los Angeles",
      latitude: 33.9425,
      longitude: -118.408056,
      stock: 355,
    },
    {
      name: "New York",
      latitude: 40.639722,
      longitude: -73.778889,
      stock: 578,
    },
    {
      name: "São Paulo",
      latitude: -23.435556,
      longitude: -46.473056,
      stock: 265,
    },
    {
      name: "Paris",
      latitude: 49.009722,
      longitude: 2.547778,
      stock: 694,
    },
    {
      name: "Warsaw",
      latitude: 52.165833,
      longitude: 20.967222,
      stock: 245,
    },
    {
      name: "Hong Kong",
      latitude: 22.308889,
      longitude: 113.914444,
      stock: 419,
    },
  ];

  for (const warehouse of warehouses) {
    await prisma.warehouse.create({
      data: warehouse,
    });
  }

  console.log("Seed data loaded successfully");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
