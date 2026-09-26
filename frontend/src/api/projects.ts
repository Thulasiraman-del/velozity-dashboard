import apiClient from "./client";

export type Project = {
  id: string;
  name: string;
  description?: string | null;
  clientName: string;
  managerId: string;
  createdAt: string;
};

export type ProjectsResponse = {
  success: boolean;
  projects: Project[];
};

export type CreateProjectInput = {
  name: string;
  description?: string;
  clientName: string;
  managerId: string;
};

export async function getProjects(): Promise<Project[]> {
  const response = await apiClient.get<ProjectsResponse>("/projects");
  return response.data.projects;
}

export async function createProject(
  input: CreateProjectInput,
): Promise<Project> {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    project: Project;
  }>("/projects", input);

  return response.data.project;
}
