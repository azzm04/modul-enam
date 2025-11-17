// backend/src/routes/notificationsRoutes.js - Fixed
import express from "express";
import { NotificationsController } from "../controllers/notificationsController.js";
import { authenticateUserOrDevice } from "../middleware/deviceAuthMiddleware.js";

const router = express.Router();

// Protected route - authenticated users OR IoT devices can send notifications
router.post("/send", authenticateUserOrDevice, NotificationsController.send);

export default router;