import prisma from "./lib/prisma";

async function main() {
  try {
    await prisma.$connect();
    console.log("Database connection successful!");

    const userCount = await prisma.user.count();
    console.log(`Users currently in database: ${userCount}`);
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
