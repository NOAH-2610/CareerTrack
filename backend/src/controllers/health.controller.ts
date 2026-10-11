import type { Request, Response } from "express";
import prisma from "../lib/prisma";

//Basic API Health Check
export function getApiHealth(_req: Request, res: Response): void {
    res.json({
        message: "CareerTrack API is running",
    });
}

//Database health check
export async function getDatabaseHealth(
    _req: Request,
    res: Response,
): Promise<void> {
    try {
        await prisma.$queryRaw`SELECT 1`;

        res.status(200).json({
            status: "ok",
            database: "connected",
        });
    } catch (error) {
        console.error("Database health check failed",error)

        res.status(503).json({
            status: "error",
            database: "disconnected",
        });
    }
}