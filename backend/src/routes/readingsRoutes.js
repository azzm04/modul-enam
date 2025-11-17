// backend/src/routes/readingsRoutes.js - With Auth Protection
import express from "express";
import { ReadingsController } from "../controllers/readingsController.js";
import { authenticateToken, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes - anyone can view readings (monitoring page)
router.get("/", ReadingsController.list);
router.get("/latest", ReadingsController.latest);

// Protected routes - only authenticated users or sensor devices can create
router.post("/", authenticateToken, ReadingsController.create);

export default router;