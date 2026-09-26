import { Router } from "express";

import {
  createTask,
  getTasks,
  updateTaskStatus,
} from "../controllers/task.controller.js";

import {
  authenticate,
  authorizeRoles,
} from "../middleware/auth.middleware.js";

import { validateBody } from "../middleware/validation.middleware.js";

import {
  createTaskSchema,
  updateTaskStatusSchema,
} from "../validation/task.validation.js";

const router = Router();

router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "PROJECT_MANAGER", "DEVELOPER"),
  getTasks,
);

router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "PROJECT_MANAGER"),
  validateBody(createTaskSchema),
  createTask,
);

router.patch(
  "/:id/status",
  authenticate,
  authorizeRoles("ADMIN", "PROJECT_MANAGER", "DEVELOPER"),
  validateBody(updateTaskStatusSchema),
  updateTaskStatus,
);

export default router;