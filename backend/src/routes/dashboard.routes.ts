import { Router } from "express";

import { getDashboard } from "../controllers/dashboard.controller.js";

import {
  authenticate,
  authorizeRoles,
} from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "PROJECT_MANAGER",
    "DEVELOPER",
  ),
  getDashboard,
);

export default router;