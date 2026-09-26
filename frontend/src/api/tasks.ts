import apiClient from "./client";

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "DONE";

export type TaskPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  projectId: string;
  developerId: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  createdAt: string;
};

export type TasksResponse = {
  success: boolean;
  tasks: Task[];
};

export type CreateTaskInput = {
  title: string;
  description?: string;
  projectId: string;
  developerId: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate: string;
};

export async function getTasks(): Promise<Task[]> {
  const response = await apiClient.get<TasksResponse>("/tasks");
  return response.data.tasks;
}

export async function createTask(
  input: CreateTaskInput,
): Promise<Task> {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    task: Task;
  }>("/tasks", input);

  return response.data.task;
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
): Promise<Task> {
  const response = await apiClient.patch<{
    success: boolean;
    message: string;
    task: Task;
  }>(`/tasks/${taskId}/status`, { status });

  return response.data.task;
}
