import { db } from "../config/db.js";

export type CreateProjectInput = {
  name: string;
  description?: string;
  clientName: string;
  managerId: string;
};

export async function createProject(input: CreateProjectInput) {
  const manager = await db.orm.public.User.first({
    id: input.managerId,
  });

  if (!manager) {
    throw new Error("Project manager not found");
  }

  if (manager.role !== "PROJECT_MANAGER") {
    throw new Error(
      "Projects can only be assigned to project managers",
    );
  }

  const project = await db.orm.public.Project.create({
    name: input.name,
    description: input.description,
    clientName: input.clientName,
    managerId: input.managerId,
  });

  return project;
}

export async function getProjects() {
  return await db.orm.public.Project.all();
}