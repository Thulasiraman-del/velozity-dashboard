import { Router } from "express";

import {
  loginController,
  registerController,
  logoutController,
} from "../../controllers/auth.controller.js";

import {
  refreshTokenController,
} from "../../controllers/auth-refresh.controller.js";

import { validateBody } from "../../middleware/validation.middleware.js";

import {
  registerSchema,
  loginSchema,
} from "../../validation/auth.validation.js";

const router = Router();

router.post(
  "/register",
  validateBody(registerSchema),
  registerController,
);

router.post(
  "/login",
  validateBody(loginSchema),
  loginController,
);

router.post("/logout", logoutController);
router.post("/refresh", refreshTokenController);

export default router;
