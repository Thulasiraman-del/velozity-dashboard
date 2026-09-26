import type { Response } from "express";

import { getDevelopers } from "../services/user.service.js";

import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export async function getDevelopersController(
  _req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const developers = await getDevelopers();

    res.json({
      success: true,
      developers,
    });
  } catch (error) {
    console.error("Get developers error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch developers",
    });
  }
}