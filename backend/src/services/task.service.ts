
import { Temporal } from "@js-temporal/polyfill";

import { db } from "../config/db.js";
import { getSocketIO } from "../websocket/socket.js";
import { createNotification } from "./notification.service.js";

export type TaskRole =
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "DEVELOPER";

export type CreateTaskInput = {
  title: string;
  description?: string;
  projectId: string;
  developerId: string;
  status?: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  dueDate: string;
};

export type TaskActor = {
  userId: string;
  role: TaskRole;
};

export type UpdateTaskStatusInput = {
  taskId: string;
  status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
  userId: string;
};

export async function createTask(
  input: CreateTaskInput,
  actor: TaskActor,
) {
  const project = await db.orm.public.Project.first({
    id: input.projectId,
  });

  if (!project) {
    throw new Error("Project not found");
  }

  if (
    actor.role === "PROJECT_MANAGER" &&
    project.managerId !== actor.userId
  ) {
    throw new Error(
      "You can only create tasks in your own projects",
    );
  }

  const developer = await db.orm.public.User.first({
    id: input.developerId,
  });

  if (!developer) {
    throw new Error("Developer not found");
  }

  if (developer.role !== "DEVELOPER") {
    throw new Error(
      "Tasks can only be assigned to developers",
    );
  }

  const dueDate = Temporal.Instant.from(input.dueDate);

  const task = await db.orm.public.Task.create({
    title: input.title,
    description: input.description,
    projectId: input.projectId,
    developerId: input.developerId,
    status: input.status ?? "TODO",
    priority: input.priority ?? "MEDIUM",
    dueDate,
  });

  await createNotification(
    developer.id,
    `You have been assigned a new task: ${task.title}`,
  );

  return task;
}

export async function getTasks(actor: TaskActor) {
  const tasks = await db.orm.public.Task.all();

  if (actor.role === "ADMIN") {
    return tasks;
  }

  if (actor.role === "DEVELOPER") {
    return tasks.filter(
      (task) => task.developerId === actor.userId,
    );
  }

  const projects = await db.orm.public.Project.all();

  const projectIds = new Set(
    projects
      .filter((project) => project.managerId === actor.userId)
      .map((project) => project.id),
  );

  return tasks.filter((task) =>
    projectIds.has(task.projectId),
  );
}

export async function updateTaskStatus(
  input: UpdateTaskStatusInput,
  actor: TaskActor,
) {
  const task = await db.orm.public.Task.first({
    id: input.taskId,
  });

  if (!task) {
    throw new Error("Task not found");
  }

  if (
    actor.role === "DEVELOPER" &&
    task.developerId !== actor.userId
  ) {
    throw new Error(
      "You can only update your assigned tasks",
    );
  }

  if (actor.role === "PROJECT_MANAGER") {
    const project = await db.orm.public.Project.first({
      id: task.projectId,
    });

    if (!project || project.managerId !== actor.userId) {
      throw new Error(
        "You can only update tasks in your projects",
      );
    }
  }

  const updatedTask = await db.orm.public.Task
    .where({ id: input.taskId })
    .update({
      status: input.status,
    });

  if (!updatedTask) {
    throw new Error("Failed to update task");
  }

  const activityLog =
    await db.orm.public.ActivityLog.create({
      userId: input.userId,
      projectId: task.projectId,
      taskId: task.id,
      action: "TASK_STATUS_CHANGED",
      details: `Task status changed from ${task.status} to ${input.status}`,
    });

  if (
    input.status === "IN_REVIEW" &&
    task.status !== "IN_REVIEW"
  ) {
    const project = await db.orm.public.Project.first({
      id: task.projectId,
    });

    if (project) {
      await createNotification(
        project.managerId,
        `Task "${task.title}" has been moved to In Review`,
      );
    }
  }

  const io = getSocketIO();

  const activityEvent = {
    id: activityLog.id,
    projectId: activityLog.projectId,
    taskId: activityLog.taskId,
    userId: activityLog.userId,
    action: activityLog.action,
    details: activityLog.details,
    createdAt: activityLog.createdAt,
  };

  const taskStatusEvent = {
    taskId: updatedTask.id,
    projectId: updatedTask.projectId,
    status: updatedTask.status,
  };

  // Admin receives global activity.
  io.to("role:ADMIN").emit(
    "activity:new",
    activityEvent,
  );

  const project = await db.orm.public.Project.first({
    id: task.projectId,
  });

  if (project) {
    // Admin and Project Manager users viewing this project
    // receive the task update immediately.
    io.to(`project:${project.id}`).emit(
      "task:status-updated",
      taskStatusEvent,
    );

    // Admin and Project Manager users also receive
    // the activity feed event immediately.
    io.to(`project:${project.id}`).emit(
      "activity:new",
      activityEvent,
    );
  }

  // The assigned developer receives the task status update.
  io.to(`user:${task.developerId}`).emit(
    "task:status-updated",
    taskStatusEvent,
  );

  // The assigned developer receives the activity event.
  io.to(`user:${task.developerId}`).emit(
    "activity:new",
    activityEvent,
  );

  return updatedTask;
}
