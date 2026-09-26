
import { Router } from "express";

import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllRead,
} from "../controllers/notification.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// Get current user's notifications
router.get(
  "/",
  authenticate,
  getNotifications,
);

// Get current user's unread notification count
router.get(
  "/unread-count",
  authenticate,
  getUnreadCount,
);

// Mark one notification as read
router.patch(
  "/:id/read",
  authenticate,
  markNotificationRead,
);

// Mark all notifications as read
router.patch(
  "/read-all",
  authenticate,
  markAllRead,
);

export default router;
