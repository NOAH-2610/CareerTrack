import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./lib/prisma";
import healthRoutes from "./routes/health.routes";
import authRoutes from "./routes/auth.routes";
import companyRoutes from "./routes/company.routes";
import applicationRoutes from "./routes/application.routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

//Health check routes
app.use("/", healthRoutes);
app.use("/health", healthRoutes);

app.use("/auth", authRoutes);
app.use("/companies", companyRoutes);
app.use("/applications", applicationRoutes);

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
