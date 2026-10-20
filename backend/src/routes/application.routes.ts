
import { Router } from "express";
import { createApplication, listApplications, getApplicationById, updateApplication, deleteApplication } from "../controllers/application.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

// All application routes require authentication.
router.use(authenticateToken);

router.post("/", createApplication);
router.get("/", listApplications);
router.get("/:id", getApplicationById);
router.patch("/:id", updateApplication);
router.delete("/:id", deleteApplication);

export default router;
