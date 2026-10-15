
import type { Request, Response } from "express";
import prisma from "../lib/prisma";

export async function createCompany(
    req: Request,
    res: Response,
): Promise<void> {
    try {
        const userId = req.authenticatedUserId;

        // The route should require authentication.
        // Keep this check as an additional safeguard.
        if (userId === undefined) {
            res.status(401).json({
                message: "Authentication is required.",
            });
            return;
        }

        const body: unknown = req.body;

        if (
            typeof body !== "object" ||
            body === null ||
            Array.isArray(body)
        ) {
            res.status(400).json({
                message: "Request body must be a JSON object.",
            });
            return;
        }

        const data = body as Record<string, unknown>;
        const allowedFields = ["name", "website", "location"];

        // Reject unexpected fields, including userId.
        if (Object.keys(data).some(
            (key) => !allowedFields.includes(key),
        )) {
            res.status(400).json({
                message: "Request contains unsupported fields.",
            });
            return;
        }

        if (
            typeof data.name !== "string" ||
            !data.name.trim()
        ) {
            res.status(400).json({
                message: "Company name is required.",
            });
            return;
        }

        // Optional fields accept strings or null.
        // Empty strings are normalized to null.
        for (const field of ["website", "location"] as const) {
            const value = data[field];

            if (
                value !== undefined &&
                value !== null &&
                typeof value !== "string"
            ) {
                res.status(400).json({
                    message: `${field} must be a string or null.`,
                });
                return;
            }
        }

        const website =
            typeof data.website === "string"
                ? data.website.trim() || null
                : null;

        const location =
            typeof data.location === "string"
                ? data.location.trim() || null
                : null;

        const company = await prisma.company.create({
            data: {
                name: data.name.trim(),
                website,
                location,
                userId,
            },
        });

        res.status(201).json({
            message: "Company created successfully.",
            company,
        });
    } catch (error) {
        console.error("Company creation failed:", error);

        res.status(500).json({
            message: "Unable to create company.",
        });
    }
}

export async function listCompanies(
    req: Request,
    res: Response,
): Promise<void> {
    try {
        const userId = req.authenticatedUserId;

        if (userId === undefined) {
            res.status(401).json({
                message: "Authentication is required.",
            });
            return;
        }

        const companies = await prisma.company.findMany({
            where: {
                userId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        res.status(200).json({
            message: "Companies retrieved successfully.",
            count: companies.length,
            companies,
        });
    } catch (error) {
        console.error("Fetching companies failed:", error);

        res.status(500).json({
            message: "Unable to retrieve companies.",
        });
    }
}

export async function getCompanyById (
    req: Request,
    res: Response,
): Promise<void> {
    try {
        const userId = req.authenticatedUserId;

        if (userId === undefined) {
            res.status(401).json({
                message: "Authentication is required",
            });
            return;
        }

        const companyId = Number(req.params.id);

        if (
            !Number.isSafeInteger(companyId) ||
            companyId <= 0
        ) {
            res.status(400).json({
                message: "Company ID must be a positive integer.",
            });
            return;
        }

        const company = await prisma.company.findFirst({
            where: {
                id: companyId,
                userId,
            },
        });

        if (!company) {
            res.status(404).json({
                message: "Company not found.",
            });
            return;
        }

        res.status(200).json({
            message:"Company retrieved successfully.",
            company,
        });
    } catch (error) {
        console.error("Fetching company failed:", error);

        res.status(500).json({
            message: "Unable to retrieve company",
        });
    }
}

export async function updateCompany (
    req: Request,
    res: Response,
): Promise<void> {
    try {
        const userId = req.authenticatedUserId;

        if (userId === undefined) {
            res.status(401).json({
                message: "Authentication is required.",
            });
            return;
        }

        const companyId = Number(req.params.id);

        if (
            !Number.isSafeInteger(companyId) ||
            companyId <= 0
        ) {
            res.status(400).json({
                message: "Company ID must be a positive integer.",
            });
            return;
        }

        const body: unknown = req.body;

        if (
            typeof body !== "object" ||
            body === null ||
            Array.isArray(body)
        ) {
            res.status(400).json({
                message: "Request body must be a JSON object.",
            });
            return;
        }

        const data = body as Record<string, unknown>;
        const allowedFields = ["name", "website", "location"];
        const fields = Object.keys(data);

        if (
            fields.length === 0 ||
            fields.some((key) => !allowedFields.includes(key))
        ) {
            res.status(400).json({
                message: "Provide valid company fields to update.",
            });
            return;
        }

        if (
            "name" in data && (
                typeof data.name !== "string" ||
                !data.name.trim()
            )
        ) {
            res.status(400).json({
                message: "Company name must be a non-empty string.",
            });
            return;
        }

        for (const field of ["website", "location"] as const) {
            const value = data[field]

            if (
                value !== undefined &&
                value !== null &&
                typeof value !== "string"
            ) {
                res.status(400).json({
                    message: `${field} must be a string or null.`,
                });
                return;
            }
        }

        const existingCompany = await prisma.company.findFirst({
            where: {
                id: companyId,
                userId,
            },
            select: {
                id:true,
            },
        });

        if (!existingCompany) {
            res.status(404).json({
                message: "Company not found.",
            });
            return;
        }

        const updateData: {
            name?: string,
            website?: string | null,
            location?: string | null,
        } = {};

        if (typeof data.name === "string") {
            updateData.name = data.name.trim();
        }

        if ("website" in data) {
            updateData.website = 
                typeof data.website === "string"
                    ? data.website.trim() || null
                    : null;
        }

        if ("location" in data) {
            updateData.location = 
                typeof data.location === "string"
                    ? data.location.trim() || null
                    : null;
        }

        const company = await prisma.company.update({
            where: {
                id: existingCompany.id,
            },
            data: updateData,
        });

        res.status(200).json({
            message: "Company updated successfully.",
            company,
        }); 
    } catch (error) {
        console.error("Company update failed:", error);

        res.status(500).json({
            message: "Unable to update company.",
        });
    }
}

export async function deleteCompany (
    req: Request,
    res: Response,
): Promise<void> {
    try {
        const userId = req.authenticatedUserId;

        if (userId === undefined) {
            res.status(401).json({
                message: "Authentication is required.",
            });
            return;
        }

        const companyId = Number(req.params.id);

        if (
            !Number.isSafeInteger(companyId) ||
            companyId <= 0
        ) {
            res.status(400).json({
                message: "Company ID must be a positive integer.",
            });
            return;
        }

        const company = await prisma.company.findFirst({
            where: {
                id: companyId,
                userId,
            },
            select: {
                id: true,
            },
        });

        if (!company) {
            res.status(404).json({
                message: "Company not found.",
            });
            return;
        }

        const applicationCount = await prisma.application.count({
            where: {
                companyId: company.id,
                userId,
            },
        });

        if (applicationCount > 0) {
            res.status(409).json({
                message: "Company cannot be deleted while job applications are linked to it.",
                linkedApplications: applicationCount,
            });
            return;
        }

        await prisma.company.delete({
            where: {
                id: company.id,
            },
        });

        res.status(200).json({
            message: "Company deleted successfully.",
        });
    } catch (error) {
        console.error("Company deletion failed:", error);

        res.status(500).json({
            message: "Unable to delete company.",
        });
    }
}