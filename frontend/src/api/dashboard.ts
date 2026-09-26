import apiClient from "./client";

export type DashboardStatusCounts = {
  TODO: number;
  IN_PROGRESS: number;
  IN_REVIEW: number;
  DONE: number;
};

export type AdminDashboard = {
  totalProjects: number;
  totalTasks: number;
  statusCounts: DashboardStatusCounts;
  overdueTasks: number;
  onlineUsers: number;
};

export type DashboardResponse = {
  success: boolean;
  role: "ADMIN" | "PROJECT_MANAGER" | "DEVELOPER";
  dashboard: AdminDashboard;
};

export async function getDashboard(): Promise<DashboardResponse> {
  const response =
    await apiClient.get<DashboardResponse>("/dashboard");

  return response.data;
}
