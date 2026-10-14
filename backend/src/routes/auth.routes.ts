import { Router } from "express";
import { register, login } from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);

router.get("/me", authenticateToken, (req, res) => {
    res.status(200).json({
        message: "Authentication successful.",
        userId: req.authenticatedUserId,
    });
});

export default router;