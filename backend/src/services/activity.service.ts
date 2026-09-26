
import { db } from "../config/db.js";

export type ActivityRole =
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "DEVELOPER";

export async function getProjectActivities(
  projectId: string,
  userId?: string,
  role?: ActivityRole,
) {
  const project = await db.orm.public.Project.first({
    id: projectId,
  });

  if (!project) {
    throw new Error("Project not found");
  }

  // Admin can view every project's activity.
  if (role === "ADMIN") {
    // Allowed
  }

  // Project Manager can view only their own project's activity.
  else if (role === "PROJECT_MANAGER") {
    if (project.managerId !== userId) {
      throw new Error("You do not have permission to view this project");
    }
  }

  // Developer can view activity only for tasks assigned to them.
  else if (role === "DEVELOPER") {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const tasks = await db.orm.public.Task.all();

    const assignedTaskIds = new Set(
      tasks
        .filter(
          (task) =>
            task.projectId === projectId &&
            task.developerId === userId,
        )
        .map((task) => task.id),
    );

    const activities = await db.orm.public.ActivityLog.all();

    return activities
      .filter(
        (activity) =>
          activity.projectId === projectId &&
          activity.taskId !== null &&
          assignedTaskIds.has(activity.taskId),
      )
      .sort(
        (a, b) =>
          b.createdAt.epochMilliseconds -
          a.createdAt.epochMilliseconds,
      )
      .slice(0, 20);
  }

  const activities = await db.orm.public.ActivityLog.all();

  return activities
    .filter(
      (activity) => activity.projectId === projectId,
    )
    .sort(
      (a, b) =>
        b.createdAt.epochMilliseconds -
        a.createdAt.epochMilliseconds,
    )
    .slice(0, 20);
}

export async function getActivityFeed(
  userId: string,
  role: ActivityRole,
) {
  const activities = await db.orm.public.ActivityLog.all();

  if (role === "ADMIN") {
    return activities
      .sort(
        (a, b) =>
          b.createdAt.epochMilliseconds -
          a.createdAt.epochMilliseconds,
      )
      .slice(0, 20);
  }

  if (role === "PROJECT_MANAGER") {
    const projects = await db.orm.public.Project.all();

    const ownProjectIds = new Set(
      projects
        .filter(
          (project) => project.managerId === userId,
        )
        .map((project) => project.id),
    );

    return activities
      .filter((activity) =>
        ownProjectIds.has(activity.projectId),
      )
      .sort(
        (a, b) =>
          b.createdAt.epochMilliseconds -
          a.createdAt.epochMilliseconds,
      )
      .slice(0, 20);
  }

  const tasks = await db.orm.public.Task.all();

  const assignedTaskIds = new Set(
    tasks
      .filter(
        (task) => task.developerId === userId,
      )
      .map((task) => task.id),
  );

  return activities
    .filter(
      (activity) =>
        activity.taskId !== null &&
        assignedTaskIds.has(activity.taskId),
    )
    .sort(
      (a, b) =>
        b.createdAt.epochMilliseconds -
        a.createdAt.epochMilliseconds,
    )
    .slice(0, 20);
}
