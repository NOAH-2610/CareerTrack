import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./lib/prisma";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Basic API health check
app.get("/", (_req, res) => {
  res.json({
    message: "CareerTrack API is running",
  });
});

// Database health check
app.get("/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(503).json({
      status: "error",
      database: "disconnected",
    });
  }
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Close database connections gracefully when the server stops
async function shutdown() {
  console.log("Shutting down CareerTrack API...");

  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
