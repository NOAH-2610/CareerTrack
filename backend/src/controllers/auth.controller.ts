import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma";
import jwt from "jsonwebtoken";

export async function register (
    req: Request,
    res: Response,
): Promise<void> {
    try {
        const { name, email, password } = req.body ?? {};
        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !email.trim() ||
            !password
        ) {
            res.status(400).json({
                message: "Name, email and password are required.",
            });
            return;
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (password.length < 8) {
            res.status(400).json({
                message: "Password must be atleast 8 characters long.",
            });
            return;
        }

        if (Buffer.byteLength(password, "utf-8") > 72) {
            res.status(400).json({
                message: "Password must not exceed 72 UTF-8 bytes.",
            });
            return;
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: {id: true},
        });

        if (existingUser) {
            res.status(409).json({
                message: "An account with this email already exists.",
            });
            return;
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                email: normalizedEmail,
                passwordHash,
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
            },
        });

        res.status(201).json({
            message: "Account created successfully",
            user,
        });
    } catch (error) {
        // Handle a duplicate email even if concurrent requests race
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code == "P2002"
        ){
            res.status(409).json({
                message: "An account with this email already exits.",
            });
            return;
        }

        console.error("Registration failed:", error);

        res.status(500).json({
            message: "Unable to create account.",
        });
    }

}

export async function login (
    req: Request,
    res: Response,
): Promise<void> {
    try {
        const { email, password } = req.body ?? {};

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            res.status(400).json({
                message: "Email and password are required.",
            });
            return;
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: {
                id: true,
                name: true,
                email: true,
                passwordHash: true,
            },
        });

        //Use the same error for unknown emails and incorrect passwords
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            res.status(401).json({
                message: "Invalid email or password.",
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

        const token = jwt.sign(
            { sub: String(user.id) },
            secret,
            { expiresIn: "1h" },
        );

        res.status(200).json({
            message: "Login successfull.",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,  
            },
        });
    } catch (error) {
        console.error("Login failed:", error);

        res.status(500).json({
            message: "Unable to log in.",
        });
    }
}