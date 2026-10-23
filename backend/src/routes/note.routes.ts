import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { createNote, getNotes, getNoteById, updateNote, deleteNote } from "../controllers/note.controller";

const router = Router();

router.use(authenticateToken);

router.post("/applications/:applicationId/notes", createNote);
router.get("/applications/:applicationId/notes", getNotes);
router.get("/applications/:applicationId/notes/:noteId", getNoteById);
router.patch("/applications/:applicationId/notes/:noteId", updateNote);
router.delete("/applications/:applicationId/notes/:noteId", deleteNote);

export default router;