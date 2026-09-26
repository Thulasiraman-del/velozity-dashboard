import type { Response } from "express";

import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

import {
  getAdminDashboard,
  getProjectManagerDashboard,
  getDeveloperDashboard,
  type DashboardFilters,
} from "../services/dashboard.service.js";

function getFilters(
  req: AuthenticatedRequest,
): DashboardFilters {
  const status =
    typeof req.query.status === "string"
      ? req.query.status
      : undefined;

  const priority =
    typeof req.query.priority === "string"
      ? req.query.priority
      : undefined;

  return {
    status,
    priority,
  };
}

export async function getDashboard(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    const filters = getFilters(req);

    if (user.role === "ADMIN") {
      const dashboard =
        await getAdminDashboard(filters);

      res.json({
        success: true,
        role: user.role,
        dashboard,
      });

      return;
    }

    if (user.role === "PROJECT_MANAGER") {
      const dashboard =
        await getProjectManagerDashboard(
          user.userId,
          filters,
        );

      res.json({
        success: true,
        role: user.role,
        dashboard,
      });

      return;
    }

    const dashboard =
      await getDeveloperDashboard(
        user.userId,
        filters,
      );

    res.json({
      success: true,
      role: user.role,
      dashboard,
    });
  } catch (error) {
    console.error(
      "Get dashboard error:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard",
    });
  }
}