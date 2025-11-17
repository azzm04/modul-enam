// backend/src/routes/thresholdsRoutes.js - With Auth Protection
import express from "express";
import { ThresholdsController } from "../controllers/thresholdsController.js";
import { authenticateToken, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes - anyone can view thresholds (including monitoring page)
router.get("/", ThresholdsController.list);
router.get("/latest", ThresholdsController.latest);

// Protected routes - only authenticated users can create/modify
router.post("/", authenticateToken, ThresholdsController.create);

export default router;