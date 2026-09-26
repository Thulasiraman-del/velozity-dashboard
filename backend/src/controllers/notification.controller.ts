
import type { Response } from "express";

import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/notification.service.js";

export async function getNotifications(
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

    const notifications = await getUserNotifications(
      user.userId,
    );

    res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
}

export async function getUnreadCount(
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

    const unreadCount =
      await getUnreadNotificationCount(user.userId);

    res.json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error("Get unread count error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch unread notification count",
    });
  }
}

export async function markNotificationRead(
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

    const notificationId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!notificationId) {
      res.status(400).json({
        success: false,
        message: "Notification ID is required",
      });
      return;
    }

    const notification =
      await markNotificationAsRead(
        notificationId,
        user.userId,
      );

    res.json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error(
      "Mark notification read error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to mark notification as read";

    if (message === "Notification not found") {
      res.status(404).json({
        success: false,
        message,
      });
      return;
    }

    if (
      message ===
      "Notification does not belong to this user"
    ) {
      res.status(403).json({
        success: false,
        message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
    });
  }
}

export async function markAllRead(
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

    const result =
      await markAllNotificationsAsRead(
        user.userId,
      );

    res.json({
      success: true,
      message: "All notifications marked as read",
      updatedCount: result.updatedCount,
    });
  } catch (error) {
    console.error(
      "Mark all notifications read error:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
    });
  }
}

