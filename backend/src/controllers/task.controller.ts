
import type { Response } from "express";

import {
  createTask as createTaskService,
  getTasks as getTasksService,
  updateTaskStatus as updateTaskStatusService,
} from "../services/task.service.js";

import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

const validStatuses = [
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
] as const;

export async function createTask(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const task = await createTaskService(req.body, {
      userId: user.userId,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error("Create task error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create task";

    const statusCodeMap: Record<string, number> = {
      "Project not found": 404,
      "Developer not found": 404,
      "You can only create tasks in your own projects": 403,
      "Tasks can only be assigned to developers": 400,
    };

    res.status(statusCodeMap[message] ?? 500).json({
      success: false,
      message,
    });
  }
}

export async function getTasks(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const tasks = await getTasksService({
      userId: user.userId,
      role: user.role,
    });

    res.json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error("Get tasks error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
    });
  }
}

export async function updateTaskStatus(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    const taskId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const { status } = req.body;

    if (!taskId) {
      res.status(400).json({
        success: false,
        message: "Task ID is required",
      });
      return;
    }

    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: "Invalid task status",
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

    const updatedTask = await updateTaskStatusService(
      {
        taskId,
        status,
        userId: user.userId,
      },
      {
        userId: user.userId,
        role: user.role,
      },
    );

    res.json({
      success: true,
      message: "Task status updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update task status error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to update task status";

    const statusCodeMap: Record<string, number> = {
      "Task not found": 404,
      "You can only update your assigned tasks": 403,
      "You can only update tasks in your projects": 403,
      "Failed to update task": 500,
    };

    res.status(statusCodeMap[message] ?? 500).json({
      success: false,
      message,
    });
  }
}
