import apiClient from "./client";

export type Notification = {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export async function getNotifications(): Promise<Notification[]> {
  const response = await apiClient.get<{ success: boolean; notifications: Notification[] }>("/notifications");
  return response.data.notifications;
}

export async function markNotificationAsRead(id: string): Promise<Notification> {
  const response = await apiClient.patch<{ success: boolean; notification: Notification }>(`/notifications/${id}/read`);
  return response.data.notification;
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await apiClient.patch("/notifications/read-all");
}
