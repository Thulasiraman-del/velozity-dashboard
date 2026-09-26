
import type { Response } from "express";

import {
  createProject as createProjectService,
  getProjects as getProjectsService,
} from "../services/project.service.js";

import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export async function createProject(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    const { name, description, clientName } = req.body;

    const managerId =
      req.user?.role === "PROJECT_MANAGER"
        ? req.user.userId
        : req.body.managerId;

    const project = await createProjectService({
      name,
      description,
      clientName,
      managerId,
    });

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error("Create project error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create project";

    const statusCode =
      message === "Project manager not found" ||
      message === "Projects can only be assigned to project managers"
        ? 400
        : 500;

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
}

export async function getProjects(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    const projects = await getProjectsService();

    if (req.user?.role === "PROJECT_MANAGER") {
      const ownProjects = projects.filter(
        (project) => project.managerId === req.user?.userId,
      );

      res.json({
        success: true,
        projects: ownProjects,
      });

      return;
    }

    res.json({
      success: true,
      projects,
    });
  } catch (error) {
    console.error("Get projects error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
    });
  }
}
