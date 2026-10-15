import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { createCompany, listCompanies, getCompanyById, updateCompany, deleteCompany } from "../controllers/company.controller";

const router = Router();

router.use(authenticateToken);

router.post("/", createCompany);
router.get("/", listCompanies);
router.get("/:id", getCompanyById);
router.patch("/:id", updateCompany);
router.delete("/:id", deleteCompany);

export default router;