import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";

import {
    createInterview,
    getInterviews,
    getInterviewById,
    updateInterview,
    deleteInterview,
} from "../controllers/interview.controller";

const router = Router();

// Require authentication for all Interview endpoints
router.use(authenticateToken);

// Create an interview
router.post(
    "/applications/:applicationId/interviews",
    createInterview
);

// List interviews belonging to an application
router.get(
    "/applications/:applicationId/interviews",
    getInterviews
);

// Retrieve one interview
router.get(
    "/applications/:applicationId/interviews/:interviewId",
    getInterviewById
);

// Update an interview
router.patch(
    "/applications/:applicationId/interviews/:interviewId",
    updateInterview
);

// Delete an interview
router.delete(
    "/applications/:applicationId/interviews/:interviewId",
    deleteInterview
);

export default router;