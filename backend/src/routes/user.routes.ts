import { Router } from "express";

import { getDevelopersController } from "../controllers/user.controller.js";

import {
  authenticate,
  authorizeRoles,
} from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/developers",
  authenticate,
  authorizeRoles("ADMIN", "PROJECT_MANAGER"),
  getDevelopersController,
);

export default router;