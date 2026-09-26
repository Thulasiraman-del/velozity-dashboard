
import type { Response } from "express";

import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

import {
  getProjectActivities,
  getActivityFeed,
} from "../services/activity.service.js";

export async function getProjectActivity(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const projectId =
      Array.isArray(req.params.projectId)
        ? req.params.projectId[0]
        : req.params.projectId;

    if (!projectId) {
      res.status(400).json({
        success: false,
        message: "Project ID is required",
      });

      return;
    }

    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    const activities = await getProjectActivities(
      projectId,
      user.userId,
      user.role,
    );

    res.json({
      success: true,
      activities,
    });
  } catch (error) {
    console.error("Get project activity error:", error);

    if (
      error instanceof Error &&
      error.message === "Project not found"
    ) {
      res.status(404).json({
        success: false,
        message: "Project not found",
      });

      return;
    }

    if (
      error instanceof Error &&
      error.message ===
        "You do not have permission to view this project"
    ) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to view this project",
      });

      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to fetch project activity",
    });
  }
}

export async function getActivityFeedController(
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

    const activities = await getActivityFeed(
      user.userId,
      user.role,
    );

    res.json({
      success: true,
      activities,
    });
  } catch (error) {
    console.error("Get activity feed error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch activity feed",
    });
  }
}
