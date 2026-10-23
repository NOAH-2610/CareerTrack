import type { Request, Response } from "express";
import { InterviewType } from "@prisma/client";
import prisma from "../lib/prisma";

export const createInterview = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = req.authenticatedUserId;
        const applicationId = Number(req.params.applicationId);

        // Check authentication.
        if (!userId) {
            res.status(401).json({ message: "Authentication required" });
            return;
        }

        // Validate the application ID.
        if (
            !Number.isSafeInteger(applicationId) ||
            applicationId <= 0
        ) {
            res.status(400).json({ message: "Invalid application ID" });
            return;
        }

        // Validate the request body.
        if (
            typeof req.body !== "object" ||
            req.body === null ||
            Array.isArray(req.body)
        ) {
            res.status(400).json({
                message: "Request body must be an object",
            });
            return;
        }

        // Reject fields that clients are not allowed to set.
        const allowedFields = [
            "type",
            "scheduledAt",
            "location",
            "meetingUrl",
            "notes",
        ];

        const unsupportedFields = Object.keys(req.body).filter(
            (field) => !allowedFields.includes(field)
        );

        if (unsupportedFields.length > 0) {
            res.status(400).json({
                message: "Unsupported field(s)",
                fields: unsupportedFields,
            });
            return;
        }

        const { type, scheduledAt, location, meetingUrl, notes } = req.body;

        // Validate interview type.
        if (
            typeof type !== "string" ||
            !Object.values(InterviewType).includes(type as InterviewType)
        ) {
            res.status(400).json({
                message: "Invalid interview type",
                allowedTypes: Object.values(InterviewType),
            });
            return;
        }

        const interviewType = type as InterviewType;

        // Validate the scheduled date and time.
        if (
            typeof scheduledAt !== "string" ||
            scheduledAt.trim().length === 0 ||
            !Number.isFinite(Date.parse(scheduledAt))
        ) {
            res.status(400).json({
                message: "scheduledAt must be a valid date and time",
            });
            return;
        }

        const scheduledDate = new Date(scheduledAt);

        // Require an ISO-style date-time containing a timezone.
        if (
            !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(
                scheduledAt
            )
        ) {
            res.status(400).json({
                message:
                    "scheduledAt must be an ISO date-time with a timezone",
            });
            return;
        }

        // Validate optional location.
        if (
            location !== undefined &&
            location !== null &&
            typeof location !== "string"
        ) {
            res.status(400).json({
                message: "location must be a string or null",
            });
            return;
        }

        if (typeof location === "string" && location.trim().length > 500) {
            res.status(400).json({
                message: "location must not exceed 500 characters",
            });
            return;
        }

        // Validate optional meeting URL.
        if (
            meetingUrl !== undefined &&
            meetingUrl !== null &&
            typeof meetingUrl !== "string"
        ) {
            res.status(400).json({
                message: "meetingUrl must be a string or null",
            });
            return;
        }

        if (typeof meetingUrl === "string" && meetingUrl.trim().length > 0) {
            try {
                const parsedUrl = new URL(meetingUrl.trim());

                if (
                    parsedUrl.protocol !== "http:" &&
                    parsedUrl.protocol !== "https:"
                ) {
                    res.status(400).json({
                        message: "meetingUrl must use HTTP or HTTPS",
                    });
                    return;
                }
            } catch {
                res.status(400).json({
                    message: "meetingUrl must be a valid URL",
                });
                return;
            }
        }

        // Validate optional interview notes.
        if (
            notes !== undefined &&
            notes !== null &&
            typeof notes !== "string"
        ) {
            res.status(400).json({
                message: "notes must be a string or null",
            });
            return;
        }

        if (typeof notes === "string" && notes.length > 10000) {
            res.status(400).json({
                message: "notes must not exceed 10000 characters",
            });
            return;
        }

        // Confirm that the parent application belongs to this user.
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
                message: "Application not found",
            });
            return;
        }

        // Create the interview.
        const interview = await prisma.interview.create({
            data: {
                applicationId: application.id,
                type: interviewType,
                scheduledAt: scheduledDate,
                location:
                    typeof location === "string" ? location.trim() || null : location ?? null,
                meetingUrl:
                    typeof meetingUrl === "string"
                        ? meetingUrl.trim() || null
                        : meetingUrl ?? null,
                notes: notes ?? null,
            },
        });

        res.status(201).json({
            message: "Interview created successfully",
            interview,
        });
    } catch (error) {
        console.error("Create interview error:", error);

        res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const getInterviews = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = req.authenticatedUserId;
        const applicationId = Number(req.params.applicationId);

        // 1. Verify authentication
        if (!userId) {
            res.status(401).json({ message: "Authentication required" });
            return;
        }

        // 2. Validate application ID
        if (!Number.isSafeInteger(applicationId) || applicationId <= 0) {
            res.status(400).json({ message: "Invalid application ID" });
            return;
        }

        // 3. Verify application ownership
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
            res.status(404).json({ message: "Application not found" });
            return;
        }

        // 4. Retrieve interviews belonging to this application
        const interviews = await prisma.interview.findMany({
            where: {
                applicationId: application.id,
            },
            orderBy: {
                scheduledAt: "asc",
            },
        });

        // 5. Return the result
        res.status(200).json({
            message: "Interviews retrieved successfully",
            count: interviews.length,
            interviews,
        });
    } catch (error) {
        console.error("Get interviews error:", error);

        res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const getInterviewById = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = req.authenticatedUserId;
        const applicationId = Number(req.params.applicationId);
        const interviewId = Number(req.params.interviewId);

        // 1. Verify authentication
        if (!userId) {
            res.status(401).json({ message: "Authentication required" });
            return;
        }

        // 2. Validate application ID
        if (!Number.isSafeInteger(applicationId) || applicationId <= 0) {
            res.status(400).json({ message: "Invalid application ID" });
            return;
        }

        // 3. Validate interview ID
        if (!Number.isSafeInteger(interviewId) || interviewId <= 0) {
            res.status(400).json({ message: "Invalid interview ID" });
            return;
        }

        // 4. Verify application ownership
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
            res.status(404).json({ message: "Application not found" });
            return;
        }

        // 5. Find the interview within this application
        const interview = await prisma.interview.findFirst({
            where: {
                id: interviewId,
                applicationId: application.id,
            },
        });

        if (!interview) {
            res.status(404).json({ message: "Interview not found" });
            return;
        }

        // 6. Return the interview
        res.status(200).json({
            message: "Interview retrieved successfully",
            interview,
        });
    } catch (error) {
        console.error("Get interview error:", error);

        res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const updateInterview = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = req.authenticatedUserId;
        const applicationId = Number(req.params.applicationId);
        const interviewId = Number(req.params.interviewId);

        // 1. Verify authentication
        if (!userId) {
            res.status(401).json({ message: "Authentication required" });
            return;
        }

        // 2. Validate IDs
        if (!Number.isSafeInteger(applicationId) || applicationId <= 0) {
            res.status(400).json({ message: "Invalid application ID" });
            return;
        }

        if (!Number.isSafeInteger(interviewId) || interviewId <= 0) {
            res.status(400).json({ message: "Invalid interview ID" });
            return;
        }

        // 3. Validate the request body
        if (
            typeof req.body !== "object" ||
            req.body === null ||
            Array.isArray(req.body)
        ) {
            res.status(400).json({ message: "Request body must be an object" });
            return;
        }

        const allowedFields = [
            "type",
            "scheduledAt",
            "location",
            "meetingUrl",
            "notes",
        ];

        const unsupportedFields = Object.keys(req.body).filter(
            (field) => !allowedFields.includes(field)
        );

        if (unsupportedFields.length > 0) {
            res.status(400).json({
                message: "Unsupported field(s)",
                fields: unsupportedFields,
            });
            return;
        }

        if (Object.keys(req.body).length === 0) {
            res.status(400).json({
                message: "At least one field must be provided",
            });
            return;
        }

        // 4. Verify application ownership
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
            res.status(404).json({ message: "Application not found" });
            return;
        }

        // 5. Verify the interview belongs to this application
        const existingInterview = await prisma.interview.findFirst({
            where: {
                id: interviewId,
                applicationId: application.id,
            },
            select: {
                id: true,
            },
        });

        if (!existingInterview) {
            res.status(404).json({ message: "Interview not found" });
            return;
        }

        // 6. Validate and prepare the supplied fields
        const data: {
            type?: InterviewType;
            scheduledAt?: Date;
            location?: string | null;
            meetingUrl?: string | null;
            notes?: string | null;
        } = {};

        if (Object.hasOwn(req.body, "type")) {
            const { type } = req.body;

            if (
                typeof type !== "string" ||
                !Object.values(InterviewType).includes(type as InterviewType)
            ) {
                res.status(400).json({
                    message: "Invalid interview type",
                    allowedTypes: Object.values(InterviewType),
                });
                return;
            }

            data.type = type as InterviewType;
        }

        if (Object.hasOwn(req.body, "scheduledAt")) {
            const { scheduledAt } = req.body;

            if (
                typeof scheduledAt !== "string" ||
                scheduledAt.trim().length === 0 ||
                !Number.isFinite(Date.parse(scheduledAt)) ||
                !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(
                    scheduledAt
                )
            ) {
                res.status(400).json({
                    message: "scheduledAt must be a valid ISO date-time with a timezone",
                });
                return;
            }

            data.scheduledAt = new Date(scheduledAt);
        }

        if (Object.hasOwn(req.body, "location")) {
            const { location } = req.body;

            if (
                location !== null &&
                typeof location !== "string"
            ) {
                res.status(400).json({
                    message: "location must be a string or null",
                });
                return;
            }

            if (typeof location === "string" && location.trim().length > 500) {
                res.status(400).json({
                    message: "location must not exceed 500 characters",
                });
                return;
            }

            data.location =
                typeof location === "string"
                    ? location.trim() || null
                    : null;
        }

        if (Object.hasOwn(req.body, "meetingUrl")) {
            const { meetingUrl } = req.body;

            if (
                meetingUrl !== null &&
                typeof meetingUrl !== "string"
            ) {
                res.status(400).json({
                    message: "meetingUrl must be a string or null",
                });
                return;
            }

            if (typeof meetingUrl === "string" && meetingUrl.trim().length > 0) {
                try {
                    const parsedUrl = new URL(meetingUrl.trim());

                    if (
                        parsedUrl.protocol !== "http:" &&
                        parsedUrl.protocol !== "https:"
                    ) {
                        res.status(400).json({
                            message: "meetingUrl must use HTTP or HTTPS",
                        });
                        return;
                    }
                } catch {
                    res.status(400).json({
                        message: "meetingUrl must be a valid URL",
                    });
                    return;
                }
            }

            data.meetingUrl =
                typeof meetingUrl === "string"
                    ? meetingUrl.trim() || null
                    : null;
        }

        if (Object.hasOwn(req.body, "notes")) {
            const { notes } = req.body;

            if (notes !== null && typeof notes !== "string") {
                res.status(400).json({
                    message: "notes must be a string or null",
                });
                return;
            }

            if (typeof notes === "string" && notes.length > 10000) {
                res.status(400).json({
                    message: "notes must not exceed 10000 characters",
                });
                return;
            }

            data.notes = notes;
        }

        // 7. Update the interview
        const interview = await prisma.interview.update({
            where: {
                id: existingInterview.id,
            },
            data,
        });

        res.status(200).json({
            message: "Interview updated successfully",
            interview,
        });
    } catch (error) {
        console.error("Update interview error:", error);

        res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const deleteInterview = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = req.authenticatedUserId;
        const applicationId = Number(req.params.applicationId);
        const interviewId = Number(req.params.interviewId);

        // 1. Verify authentication
        if (!userId) {
            res.status(401).json({ message: "Authentication required" });
            return;
        }

        // 2. Validate application ID
        if (!Number.isSafeInteger(applicationId) || applicationId <= 0) {
            res.status(400).json({ message: "Invalid application ID" });
            return;
        }

        // 3. Validate interview ID
        if (!Number.isSafeInteger(interviewId) || interviewId <= 0) {
            res.status(400).json({ message: "Invalid interview ID" });
            return;
        }

        // 4. Verify application ownership
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
            res.status(404).json({ message: "Application not found" });
            return;
        }

        // 5. Verify that the interview belongs to this application
        const existingInterview = await prisma.interview.findFirst({
            where: {
                id: interviewId,
                applicationId: application.id,
            },
            select: {
                id: true,
            },
        });

        if (!existingInterview) {
            res.status(404).json({ message: "Interview not found" });
            return;
        }

        // 6. Delete the interview
        await prisma.interview.delete({
            where: {
                id: existingInterview.id,
            },
        });

        // 7. Return the response
        res.status(200).json({
            message: "Interview deleted successfully",
        });
    } catch (error) {
        console.error("Delete interview error:", error);

        res.status(500).json({
            message: "Internal server error",
        });
    }
};