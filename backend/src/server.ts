import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./lib/prisma";
import healthRoutes from "./routes/health.routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

//Health check routes
app.use("/", healthRoutes);
app.use("/health", healthRoutes);

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
