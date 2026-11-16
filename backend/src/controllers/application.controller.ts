import type { Request, Response } from "express";
import { ApplicationStatus, JobType, Prisma } from "@prisma/client";
import prisma from "../lib/prisma";

export async function createApplication(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const userId = req.authenticatedUserId;

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

        const allowedFields = [
            "companyId",
            "position",
            "jobType",
            "jobUrl",
            "location",
            "salaryMin",
            "salaryMax",
            "status",
            "appliedAt",
        ];

        if (
            Object.keys(data).some(
                (key) => !allowedFields.includes(key)
            )
        ) {
            res.status(400).json({
                message: "Request contains unsupported fields.",
            });
            return;
        }

        if (
            typeof data.companyId !== "number" ||
            !Number.isSafeInteger(data.companyId) ||
            data.companyId <= 0
        ) {
            res.status(400).json({
                message: "companyId must be a positive integer.",
            });
            return;
        }

        if (
            typeof data.position !== "string" ||
            !data.position.trim()
        ) {
            res.status(400).json({
                message: "Position is required.",
            });
            return;
        }

        if (
            typeof data.jobType !== "string" ||
            !Object.values(JobType).includes(data.jobType as JobType)
        ) {
            res.status(400).json({
                message: "A valid JobType is required.",
                allowedValues: Object.values(JobType),
            });
            return;
        }

        for (const field of ["jobUrl", "location"] as const) {
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

        const jobUrl =
            typeof data.jobUrl === "string"
                ? data.jobUrl.trim() || null
                : null;

        const location =
            typeof data.location === "string"
                ? data.location.trim() || null
                : null;

        if (jobUrl !== null) {
            try {
                const parsedUrl = new URL(jobUrl);

                if (
                    parsedUrl.protocol !== "http:" &&
                    parsedUrl.protocol !== "https:"
                ) {
                    throw new Error("Unsupported URL protocol.");
                }
            } catch {
                res.status(400).json({
                    message: "jobUrl must be a valid HTTP or HTTPS URL.",
                });
                return;
            }
        }

        for (const field of ["salaryMin", "salaryMax"] as const) {
            const value = data[field];

            if (
                value !== undefined &&
                value !== null &&
                (
                    typeof value !== "number" ||
                    !Number.isSafeInteger(value) ||
                    value < 0
                )
            ) {
                res.status(400).json({
                    message: `${field} must be a non-negative integer or null.`,
                });
                return;
            }
        }

        if (
            typeof data.salaryMin === "number" &&
            typeof data.salaryMax === "number" &&
            data.salaryMin > data.salaryMax
        ) {
            res.status(400).json({
                message: "salaryMin cannot exceed salaryMax.",
            });
            return;
        }

        if (
            data.status !== undefined &&
            (
                typeof data.status !== "string" ||
                !Object.values(ApplicationStatus).includes(
                    data.status as ApplicationStatus,
                )
            )
        ) {
            res.status(400).json({
                message: "Invalid application status.",
                allowedValues: Object.values(ApplicationStatus),
            });
            return;
        }

        let appliedAt: Date | null = null;

        if (data.appliedAt !== undefined && data.appliedAt !== null) {
            if (
                typeof data.appliedAt !== "string" ||
                data.appliedAt.trim() === "" ||
                !Number.isFinite(Date.parse(data.appliedAt))
            ) {
                res.status(400).json({
                    message: "appliedAt must be a valid date string or null.",
                });
                return;
            }

            appliedAt = new Date(data.appliedAt);
        }

        const company = await prisma.company.findFirst({
            where: {
                id: data.companyId,
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

        const application = await prisma.application.create({
            data: {
                userId,
                companyId: company.id,
                position: data.position.trim(),
                jobType: data.jobType as JobType,
                jobUrl,
                location,
                salaryMin:
                    typeof data.salaryMin === "number"
                        ? data.salaryMin
                        : null,
                salaryMax:
                    typeof data.salaryMax === "number"
                        ? data.salaryMax
                        : null,
                ...(data.status !== undefined
                    ? { status: data.status as ApplicationStatus }
                    : {}),
                appliedAt,
            },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        res.status(201).json({
            message: "Application created successfully.",
            application,
        });
    } catch (error) {
        console.error("Application creation failed:", error);

        res.status(500).json({
            message: "Unable to create application.",
        });
    }
}


export async function listApplications(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const userId = req.authenticatedUserId;

        if (userId === undefined) {
            res.status(401).json({
                message: "Authentication is required.",
            });
            return;
        }

        // Read query parameters
        const {
            page: pageValue,
            limit: limitValue,
            search: searchValue,
            status: statusValue,
            jobType: jobTypeValue,
            sortBy: sortByValue,
            sortOrder: sortOrderValue,
        } = req.query;

        // Validate query parameter types
        const queryValues = [
            pageValue,
            limitValue,
            searchValue,
            statusValue,
            jobTypeValue,
            sortByValue,
            sortOrderValue,
        ];

        if (
            queryValues.some(
                (value) =>
                    value !== undefined &&
                    typeof value !== "string"
            )
        ) {
            res.status(400).json({
                message: "Query parameters must be single string values.",
            });
            return;
        }

        // Pagination validation
        const paginationRequested =
            pageValue !== undefined || limitValue !== undefined;

        const page =
            pageValue === undefined ? 1 : Number(pageValue);

        const limit =
            limitValue === undefined ? 10 : Number(limitValue);

        if (
            !Number.isSafeInteger(page) ||
            page <= 0
        ) {
            res.status(400).json({
                message: "Page must be a positive integer.",
            });
            return;
        }

        if (
            !Number.isSafeInteger(limit) ||
            ![10, 25, 50].includes(limit)
        ) {
            res.status(400).json({
                message: "Limit must be 10, 25, or 50.",
            });
            return;
        }

        // Search validation
        const search =
            typeof searchValue === "string"
                ? searchValue.trim()
                : "";

        // Status validation
        if (
            statusValue !== undefined &&
            !Object.values(ApplicationStatus).includes(
                statusValue as ApplicationStatus
            )
        ) {
            res.status(400).json({
                message: "Invalid application status.",
                allowedValues: Object.values(ApplicationStatus),
            });
            return;
        }

        // Job type validation
        if (
            jobTypeValue !== undefined &&
            !Object.values(JobType).includes(
                jobTypeValue as JobType
            )
        ) {
            res.status(400).json({
                message: "Invalid job type.",
                allowedValues: Object.values(JobType),
            });
            return;
        }

        // Sorting validation
        const allowedSortFields = [
            "appliedAt",
            "company",
            "createdAt",
            "salaryMax",
        ];

        const sortBy =
            typeof sortByValue === "string"
                ? sortByValue
                : "createdAt";

        if (!allowedSortFields.includes(sortBy)) {
            res.status(400).json({
                message: "Invalid sorting field.",
                allowedValues: allowedSortFields,
            });
            return;
        }

        const sortOrder =
            typeof sortOrderValue === "string"
                ? sortOrderValue
                : "desc";

        if (
            sortOrder !== "asc" &&
            sortOrder !== "desc"
        ) {
            res.status(400).json({
                message: "sortOrder must be either asc or desc.",
            });
            return;
        }

        // Build Prisma filters
        const where: Prisma.ApplicationWhereInput = {
            userId,

            ...(search
                ? {
                    OR: [
                        {
                            position: {
                                contains: search,
                                mode: "insensitive",
                            },
                        },
                        {
                            location: {
                                contains: search,
                                mode: "insensitive",
                            },
                        },
                        {
                            company: {
                                is: {
                                    name: {
                                        contains: search,
                                        mode: "insensitive",
                                    },
                                },
                            },
                        },
                    ],
                }
                : {}),

            ...(statusValue !== undefined
                ? {
                    status: statusValue as ApplicationStatus,
                }
                : {}),

            ...(jobTypeValue !== undefined
                ? {
                    jobType: jobTypeValue as JobType,
                }
                : {}),
        };

        // Build sorting configuration
        const orderBy: Prisma.ApplicationOrderByWithRelationInput[] = [];

        switch (sortBy) {
            case "appliedAt":
                orderBy.push({
                    appliedAt: {
                        sort: sortOrder,
                        nulls: "last",
                    },
                });
                break;

            case "company":
                orderBy.push({
                    company: {
                        name: sortOrder,
                    },
                });
                break;

            case "salaryMax":
                orderBy.push({
                    salaryMax: {
                        sort: sortOrder,
                        nulls: "last",
                    },
                });
                break;

            case "createdAt":
            default:
                orderBy.push({
                    createdAt: sortOrder,
                });
                break;
        }

        // Add a stable secondary sort
        orderBy.push({
            id: "desc",
        });

        // Build database query
        const paginationOptions: {
            skip?: number;
            take?: number;
        } = paginationRequested
                ? {
                    skip: (page - 1) * limit,
                    take: limit,
                }
                : {};

        // Fetch applications and total count
        const [applications, totalItems] = await Promise.all([
            prisma.application.findMany({
                where,
                include: {
                    company: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy,
                ...paginationOptions,
            }),

            prisma.application.count({
                where,
            }),
        ]);

        // Preserve the existing response for unpaginated requests
        if (!paginationRequested) {
            res.status(200).json({
                message: "Applications retrieved successfully.",
                count: applications.length,
                applications,
            });
            return;
        }

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalItems / limit);

        res.status(200).json({
            message: "Applications retrieved successfully.",
            count: applications.length,
            applications,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        });
    } catch (error) {
        console.error("Application retrieval failed:", error);

        res.status(500).json({
            message: "Unable to retrieve applications.",
        });
    }
}

export async function getApplicationById(
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

        const applicationId = Number(req.params.id);

        if (
            !Number.isSafeInteger(applicationId) ||
            applicationId <= 0
        ) {
            res.status(400).json({
                message: "Application ID must be a positive integer.",
            });
            return;
        }

        const application = await prisma.application.findFirst({
            where: {
                id: applicationId,
                userId,
            },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!application) {
            res.status(404).json({
                message: "Application not found.",
            });
            return;
        }

        res.status(200).json({
            message: "Application retrieved successfully.",
            application,
        });
    } catch (error) {
        console.error("Application retrieval by ID failed:", error);

        res.status(500).json({
            message: "Unable to retrieve application.",
        });
    }
}


export async function updateApplication(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const userId = req.authenticatedUserId;

        if (userId === undefined) {
            res.status(401).json({
                message: "Authentication is required.",
            });
            return;
        }

        const applicationId = Number(req.params.id);

        if (
            !Number.isSafeInteger(applicationId) ||
            applicationId <= 0
        ) {
            res.status(400).json({
                message: "Application ID must be a positive integer.",
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

        const allowedFields = [
            "companyId",
            "position",
            "jobType",
            "jobUrl",
            "location",
            "salaryMin",
            "salaryMax",
            "status",
            "appliedAt",
        ];

        if (Object.keys(data).length === 0) {
            res.status(400).json({
                message: "Provide at least one field to update.",
            });
            return;
        }

        if (Object.keys(data).some((key) => !allowedFields.includes(key))) {
            res.status(400).json({
                message: "Request contains unsupported fields.",
            });
            return;
        }

        const existingApplication = await prisma.application.findFirst({
            where: {
                id: applicationId,
                userId,
            },
            select: {
                id: true,
            },
        });

        if (!existingApplication) {
            res.status(404).json({
                message: "Application not found.",
            });
            return;
        }

        const updateData: {
            companyId?: number;
            position?: string;
            jobType?: JobType;
            jobUrl?: string | null;
            location?: string | null;
            salaryMin?: number | null;
            salaryMax?: number | null;
            status?: ApplicationStatus;
            appliedAt?: Date | null;
        } = {};

        if (Object.hasOwn(data, "companyId")) {
            if (
                typeof data.companyId !== "number" ||
                !Number.isSafeInteger(data.companyId) ||
                data.companyId <= 0
            ) {
                res.status(400).json({
                    message: "companyId must be a positive integer.",
                });
                return;
            }

            const company = await prisma.company.findFirst({
                where: {
                    id: data.companyId,
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

            updateData.companyId = company.id;
        }

        if (Object.hasOwn(data, "position")) {
            if (
                typeof data.position !== "string" ||
                !data.position.trim()
            ) {
                res.status(400).json({
                    message: "Position must be a non-empty string.",
                });
                return;
            }

            updateData.position = data.position.trim();
        }

        if (Object.hasOwn(data, "jobType")) {
            if (
                typeof data.jobType !== "string" ||
                !Object.values(JobType).includes(data.jobType as JobType)
            ) {
                res.status(400).json({
                    message: "A valid JobType is required.",
                    allowedValues: Object.values(JobType),
                });
                return;
            }

            updateData.jobType = data.jobType as JobType;
        }

        for (const field of ["jobUrl", "location"] as const) {
            if (!Object.hasOwn(data, field)) {
                continue;
            }

            const value = data[field];

            if (value !== null && typeof value !== "string") {
                res.status(400).json({
                    message: `${field} must be a string or null.`,
                });
                return;
            }

            const normalizedValue =
                typeof value === "string" ? value.trim() || null : null;

            if (field === "jobUrl" && normalizedValue !== null) {
                try {
                    const parsedUrl = new URL(normalizedValue);

                    if (
                        parsedUrl.protocol !== "http:" &&
                        parsedUrl.protocol !== "https:"
                    ) {
                        throw new Error("Unsupported URL protocol.");
                    }
                } catch {
                    res.status(400).json({
                        message: "jobUrl must be a valid HTTP or HTTPS URL.",
                    });
                    return;
                }
            }

            updateData[field] = normalizedValue;
        }

        for (const field of ["salaryMin", "salaryMax"] as const) {
            if (!Object.hasOwn(data, field)) {
                continue;
            }

            const value = data[field];

            if (
                value !== null &&
                (
                    typeof value !== "number" ||
                    !Number.isSafeInteger(value) ||
                    value < 0
                )
            ) {
                res.status(400).json({
                    message: `${field} must be a non-negative integer or null.`,
                });
                return;
            }

            updateData[field] = value as number | null;
        }

        const currentApplication = await prisma.application.findUnique({
            where: {
                id: applicationId,
            },
            select: {
                salaryMin: true,
                salaryMax: true,
            },
        });

        const nextSalaryMin = Object.hasOwn(data, "salaryMin")
            ? updateData.salaryMin ?? null
            : currentApplication?.salaryMin ?? null;

        const nextSalaryMax = Object.hasOwn(data, "salaryMax")
            ? updateData.salaryMax ?? null
            : currentApplication?.salaryMax ?? null;

        if (
            nextSalaryMin !== null &&
            nextSalaryMax !== null &&
            nextSalaryMin > nextSalaryMax
        ) {
            res.status(400).json({
                message: "salaryMin cannot exceed salaryMax.",
            });
            return;
        }

        if (Object.hasOwn(data, "status")) {
            if (
                typeof data.status !== "string" ||
                !Object.values(ApplicationStatus).includes(
                    data.status as ApplicationStatus
                )
            ) {
                res.status(400).json({
                    message: "Invalid application status.",
                    allowedValues: Object.values(ApplicationStatus),
                });
                return;
            }

            updateData.status = data.status as ApplicationStatus;
        }

        if (Object.hasOwn(data, "appliedAt")) {
            const value = data.appliedAt;

            if (value === null) {
                updateData.appliedAt = null;
            } else if (
                typeof value === "string" &&
                value.trim() !== "" &&
                Number.isFinite(Date.parse(value))
            ) {
                updateData.appliedAt = new Date(value);
            } else {
                res.status(400).json({
                    message: "appliedAt must be a valid date string or null.",
                });
                return;
            }
        }

        const application = await prisma.application.update({
            where: {
                id: applicationId,
            },
            data: updateData,
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        res.status(200).json({
            message: "Application updated successfully.",
            application,
        });
    } catch (error) {
        console.error("Application update failed:", error);

        res.status(500).json({
            message: "Unable to update application.",
        });
    }
}

export async function deleteApplication(
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

        const applicationId = Number(req.params.id);

        if (
            !Number.isSafeInteger(applicationId) ||
            applicationId <= 0
        ) {
            res.status(400).json({
                message: "Application ID must be a positive integer.",
            });
            return;
        }

        const application = await prisma.application.findFirst({
            where: {
                id: applicationId,
                userId,
            },
            select: {
                id: true,
            },
        });

        if (!application) {
            res.status(404).json({
                message: "Application not found.",
            });
            return;
        }

        const [notesCount, interviewCount] = await Promise.all([
            prisma.note.count({
                where: { applicationId },
            }),
            prisma.interview.count({
                where: { applicationId },
            }),
        ]);

        if (notesCount > 0 || interviewCount > 0) {
            res.status(409).json({
                message: "This application cannot be deleted because it has related notes or interviews.",
                notesCount,
                interviewCount,
            });
            return;
        }

        await prisma.application.delete({
            where: {
                id: applicationId,
            },
        });

        res.status(200).json({
            message: "Application deleted successfully.",
            applicationId,
        });
    } catch (error) {
        console.error("Application deletion failed:", error);

        res.status(500).json({
            message: "Unable to delete application.",
        });
    }
}