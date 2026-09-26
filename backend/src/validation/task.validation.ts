import { z } from "zod";

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Task title must be at least 2 characters")
    .max(150, "Task title must not exceed 150 characters"),

  description: z
    .string()
    .trim()
    .max(1000, "Description must not exceed 1000 characters")
    .optional(),

  projectId: z
    .string()
    .uuid("Project ID must be a valid UUID"),

  developerId: z
    .string()
    .uuid("Developer ID must be a valid UUID"),

  status: z
    .enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"])
    .optional(),

  priority: z
    .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .optional(),

  dueDate: z
    .string()
    .datetime({
      offset: true,
      message: "Due date must be a valid ISO datetime",
    }),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(
    ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"],
    {
      message: "Invalid task status",
    },
  ),
});