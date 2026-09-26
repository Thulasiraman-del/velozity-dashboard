import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Project name must be at least 2 characters")
    .max(100, "Project name must not exceed 100 characters"),

  description: z
    .string()
    .trim()
    .max(500, "Description must not exceed 500 characters")
    .optional(),

  clientName: z
    .string()
    .trim()
    .min(2, "Client name must be at least 2 characters")
    .max(100, "Client name must not exceed 100 characters"),

  managerId: z
    .string()
    .uuid("Manager ID must be a valid UUID"),
});