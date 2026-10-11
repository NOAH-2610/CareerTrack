import { Router } from "express";
import prisma from "../lib/prisma";

const router = Router();

//Basic API health check
router.get('/', (_req, res) => {
    res.json({
        message: "CareerTrack API is running",
    });
});

//Database health check
router.get('/db', async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        res.status(200).json({
            status: "ok",
            database: "connected",
        });
    } catch (error) {
        console.error("Database health check failed", error);

        res.status(503).json({
            status: "error",
            database: "disconnected",
        });
    }
});

export default router;