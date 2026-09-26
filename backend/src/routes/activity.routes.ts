import { Router } from "express";

import {
  getProjectActivity,
  getActivityFeedController,
} from "../controllers/activity.controller.js";

import {
  authenticate,
  authorizeRoles,
} from "../middleware/auth.middleware.js";

const router = Router();

// Role-based activity feed
router.get(
  "/feed",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "PROJECT_MANAGER",
    "DEVELOPER",
  ),
  getActivityFeedController,
);

// Project-specific activity
router.get(
  "/project/:projectId",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "PROJECT_MANAGER",
    "DEVELOPER",
  ),
  getProjectActivity,
);

export default router;