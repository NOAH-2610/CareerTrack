import type { Request, Response } from "express";
import prisma from "../lib/prisma";
import { triggerAsyncId } from "node:async_hooks";
import { describe } from "node:test";

export const createNote = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = req.authenticatedUserId;
        const applicationId = Number(req.params.applicationId);

        //Ensure the request belongs to an authenticated user.
        if (!userId) {
            res.status(401).json({
                message: "Authentication required.",
            });
            return;
        }

        //Validate the application ID.
        if (
            !Number.isSafeInteger(applicationId) ||
            applicationId <= 0
        ) {
            res.status(400).json({ message: "Invalid application ID" });
            return;
        }

        //The request body must be a JSON object.
        if (
            typeof req.body !== "object" ||
            req.body === null ||
            Array.isArray(req.body)
        ) {
            res.status(400).json({ message: "Request body must be an on=bject." });
            return;
        }

        //Only the content field is accepted when creating a note.
        const allowedFields = ["content"];
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

        //Validate and normalize note content
        const { content } = req.body;

        if (typeof content !== "string" || content.trim().length === 0) {
            res.status(400).json({
                message: "Content must be a non empty string.",
            });
            return;
        }

        const normalizedContent = content.trim();

        if (normalizedContent.length > 10000) {
            res.status(400).json({
                message: "Content must not exceed 10000 characters.",
            });
            return;
        }

        //Verify that the application exists and belongs to this user
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
            res.status(404).json({ message: "Application not found." });
            return;
        }

        //Create the note under the verified application.
        const note = await prisma.note.create({
            data: {
                applicationId: application.id,
                content: normalizedContent,
            },
        });

        res.status(201).json({
            message: "Note created successfully",
            note,
        });
    } catch (error) {
        console.error("Create note error:", error);

        res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const getNotes = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = req.authenticatedUserId;
        const applicationId = Number(req.params.applicationId);

        if (!userId) {
            res.status(401).json({ message: "Authentication required" });
            return;
        }

        if (
            !Number.isSafeInteger(applicationId) ||
            applicationId <= 0
        ) {
            res.status(400).json({ message: "Invalid application ID" });
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
            res.status(400).json({ message: "Application not found" });
            return;
        }

        const notes = await prisma.note.findMany({
            where: {
                applicationId: application.id,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        res.status(200).json({
            message: "Notes retrieved successfully",
            count: notes.length,
            notes,
        });
    } catch (error) {
        console.error("Get notes error:", error);

        res.status(500).json({
            message: "Internal server error",
        });
    }
};


export const getNoteById = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = req.authenticatedUserId;
        const applicationId = Number(req.params.applicationId);
        const noteId = Number(req.params.noteId);

        if (!userId) {
            res.status(401).json({ message: "Authentication required" });
            return;
        }

        if (
            !Number.isSafeInteger(applicationId) ||
            applicationId <= 0
        ) {
            res.status(400).json({ message: "Invalid application ID" });
            return;
        }

        if (!Number.isSafeInteger(noteId) || noteId <= 0) {
            res.status(400).json({ message: "Invalid note ID" });
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
            res.status(404).json({ message: "Application not found" });
            return;
        }

        const note = await prisma.note.findFirst({
            where: {
                id: noteId,
                applicationId: application.id,
            },
        });

        if (!note) {
            res.status(404).json({ message: "Note not found" });
            return;
        }

        res.status(200).json({
            message: "Note retrieved successfully",
            note,
        });
    } catch (error) {
        console.error("Get note error:", error);

        res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const updateNote = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = req.authenticatedUserId;
        const applicationId = Number(req.params.applicationId);
        const noteId = Number(req.params.noteId);

        if (!userId) {
            res.status(401).json({ message: "Authentication required" });
            return;
        }

        if (
            !Number.isSafeInteger(applicationId) ||
            applicationId <= 0
        ) {
            res.status(400).json({ message: "Invalid application ID" });
            return;
        }

        if (!Number.isSafeInteger(noteId) || noteId <= 0) {
            res.status(400).json({ message: "Invalid note ID" });
            return;
        }

        if (
            typeof req.body !== "object" ||
            req.body === null ||
            Array.isArray(req.body)
        ) {
            res.status(400).json({ message: "Request must be an object" });
            return;
        }

        const allowedFields = ["content"]
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

        if (!Object.prototype.hasOwnProperty.call(req.body, "content")) {
            res.status(400).json({
                message: "At least one supported field is required",
            });
            return;
        }

        const { content } = req.body;

        if (typeof content !== "string" || content.trim().length === 0) {
            res.status(400).json({
                message: "Content must be a non-empty string",
            });
            return;
        }

        const normalizedContent = content.trim();

        if (normalizedContent.length > 10000) {
            res.status(400).json({
                message: "Content must not exceed 10000 characters",
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
            res.status(404).json({ message: "Application not found" });
            return;
        }

        const existingNote = await prisma.note.findFirst({
            where: {
                id: noteId,
                applicationId: application.id,
            },
            select: {
                id: true,
            },
        });

        if (!existingNote) {
            res.status(404).json({
                message: "Note not found"
            });
            return;
        }

        const note = await prisma.note.update({
            where: {
                id: existingNote.id,
            },
            data: {
                content: normalizedContent,
            },
        });

        res.status(200).json({
            message: "Note updated successfully",
            note,
        });
    } catch (error) {
        console.error("Update note error:", error);

        res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const deleteNote = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.authenticatedUserId;
    const applicationId = Number(req.params.applicationId);
    const noteId = Number(req.params.noteId);

    if (!userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (
      !Number.isSafeInteger(applicationId) ||
      applicationId <= 0
    ) {
      res.status(400).json({ message: "Invalid application ID" });
      return;
    }

    if (!Number.isSafeInteger(noteId) || noteId <= 0) {
      res.status(400).json({ message: "Invalid note ID" });
      return;
    }

    // Verify that the application belongs to the authenticated user.
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

    // Verify that the note belongs to the requested application.
    const existingNote = await prisma.note.findFirst({
      where: {
        id: noteId,
        applicationId: application.id,
      },
      select: {
        id: true,
      },
    });

    if (!existingNote) {
      res.status(404).json({ message: "Note not found" });
      return;
    }

    await prisma.note.delete({
      where: {
        id: existingNote.id,
      },
    });

    res.status(200).json({
      message: "Note deleted successfully",
    });
  } catch (error) {
    console.error("Delete note error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};