import apiClient from "./client";

export type Activity = {
  id: string;
  userId: string;
  projectId: string;
  taskId: string | null;
  action: string;
  details: string;
  createdAt: string;
};

export type ActivityFeedResponse = {
  success: boolean;
  activities: Activity[];
};

export async function getActivityFeed(): Promise<Activity[]> {
  const response =
    await apiClient.get<ActivityFeedResponse>(
      "/activities/feed",
    );

  return response.data.activities;
}

export async function getProjectActivity(
  projectId: string,
): Promise<Activity[]> {
  const response =
    await apiClient.get<ActivityFeedResponse>(
      `/activities/project/${projectId}`,
    );

  return response.data.activities;
}
