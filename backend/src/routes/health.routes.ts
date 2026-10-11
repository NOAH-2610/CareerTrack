import { Router } from "express";
import { getApiHealth, getDatabaseHealth } from "../controllers/health.controller";

const router = Router();

//Basic API health check
router.get("/", getApiHealth);

//Database health check
router.get("/db", getDatabaseHealth);

export default router;