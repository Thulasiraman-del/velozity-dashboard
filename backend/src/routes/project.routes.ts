import { Router } from "express";

import {
  createProject,
  getProjects,
} from "../controllers/project.controller.js";

import {
  authenticate,
  authorizeRoles,
} from "../middleware/auth.middleware.js";

import { validateBody } from "../middleware/validation.middleware.js";
import { createProjectSchema } from "../validation/project.validation.js";

const router = Router();

router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "PROJECT_MANAGER"),
  getProjects,
);

router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "PROJECT_MANAGER"),
  validateBody(createProjectSchema),
  createProject,
);

export default router;