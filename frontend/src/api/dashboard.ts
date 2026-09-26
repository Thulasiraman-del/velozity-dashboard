import apiClient from "./client";

export type DashboardStatusCounts = {
  TODO: number;
  IN_PROGRESS: number;
  IN_REVIEW: number;
  DONE: number;
};

export type DashboardPriorityCounts = {
  LOW: number;
  MEDIUM: number;
  HIGH: number;
  CRITICAL: number;
};

export type AdminDashboard = {
  totalProjects: number;
  totalTasks: number;
  statusCounts: DashboardStatusCounts;
  overdueTasks: number;
  onlineUsers: number;
};

export type ProjectManagerDashboard = {
  totalProjects: number;
  totalTasks: number;
  priorityCounts: DashboardPriorityCounts;
  upcomingWeekTasks: number;
};

export type DeveloperDashboard = {
  totalTasks: number;
  tasks: Array<{
    id: string;
    title: string;
    description?: string | null;
    projectId: string;
    developerId: string;
    status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    dueDate: string;
    createdAt: string;
  }>;
};

export type DashboardResponse =
  | {
      success: boolean;
      role: "ADMIN";
      dashboard: AdminDashboard;
    }
  | {
      success: boolean;
      role: "PROJECT_MANAGER";
      dashboard: ProjectManagerDashboard;
    }
  | {
      success: boolean;
      role: "DEVELOPER";
      dashboard: DeveloperDashboard;
    };

export async function getDashboard(
  status?: string,
  priority?: string,
): Promise<DashboardResponse> {
  const params = new URLSearchParams();

  if (status) params.set("status", status);
  if (priority) params.set("priority", priority);

  const query = params.toString();
  const response = await apiClient.get<DashboardResponse>(
    query ? `/dashboard?${query}` : "/dashboard",
  );

  return response.data;
}

