import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { expectFailure } from "node:test";

declare global {
    namespace Express {
        interface Request {
            authenticatedUserId?: number;
        }
    }
}

export function authenticateToken(
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
        res.status(401).json({
            message: "Authentication token is required.",
        });
        return;
    }

    const token = authorization.slice("Bearer ".length).trim();

    if (!token) {
        res.status(401).json({
            message: "Authentication token is required.",
        });
        return;
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        console.error("JWT_SECRET is not configured.");

        res.status(500).json({
            message: "Authentication service is not configured.",
        });
        return;
    }

    try {
        const decoded = jwt.verify(token, secret, {
            algorithms: ["HS256"],
        });

        if (
            typeof decoded === "string" ||
            typeof decoded.sub !== "string" ||
            !/^[1-9]\d*$/.test(decoded.sub)
        ) {
            res.status(401).json({
                message: "Invalid authentication token.",
            });
            return;
        }

        const userId = Number(decoded.sub);

        if (!Number.isSafeInteger(userId)) {
            res.status(401).json({
                message: "Invalid authentication token.",
            });
            return;
        }

        req.authenticatedUserId = userId;
        next();
    } catch (error) {
        if (
            error instanceof jwt.JsonWebTokenError ||
            error instanceof jwt.TokenExpiredError
        ) {
            res.status(401).json({
                message: "Invalid or expired authentication token.",
            });
            return;
        }

        console.error("Authentication middleware failed:", error);

        res.status(500).json({
            message: "Unable to authenticate request.",
        });
    }
}