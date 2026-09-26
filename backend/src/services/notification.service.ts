
import { db } from "../config/db.js";
import { getSocketIO } from "../websocket/socket.js";

export async function createNotification(
  userId: string,
  message: string,
) {
  const notification = await db.orm.public.Notification.create({
    userId,
    message,
  });

  const io = getSocketIO();

  io.to(`user:${userId}`).emit("notification:new", {
    id: notification.id,
    userId: notification.userId,
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  });

  const notifications = await db.orm.public.Notification.all();

  const unreadCount = notifications.filter(
    (item) =>
      item.userId === userId &&
      !item.isRead,
  ).length;

  io.to(`user:${userId}`).emit("notification:unread-count", {
    unreadCount,
  });

  return notification;
}

export async function getUserNotifications(
  userId: string,
) {
  const notifications =
    await db.orm.public.Notification.all();

  return notifications
    .filter((notification) => notification.userId === userId)
    .sort(
      (a, b) =>
        b.createdAt.epochMilliseconds -
        a.createdAt.epochMilliseconds,
    )
    .slice(0, 20);
}

export async function getUnreadNotificationCount(
  userId: string,
) {
  const notifications =
    await db.orm.public.Notification.all();

  return notifications.filter(
    (notification) =>
      notification.userId === userId &&
      !notification.isRead,
  ).length;
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string,
) {
  const notification =
    await db.orm.public.Notification.first({
      id: notificationId,
    });

  if (!notification) {
    throw new Error("Notification not found");
  }

  if (notification.userId !== userId) {
    throw new Error("Notification does not belong to this user");
  }

  const updatedNotification =
    await db.orm.public.Notification
      .where({ id: notificationId })
      .update({
        isRead: true,
      });

  if (!updatedNotification) {
    throw new Error("Failed to update notification");
  }

  await broadcastUnreadCount(userId);

  return updatedNotification;
}

export async function markAllNotificationsAsRead(
  userId: string,
) {
  const notifications =
    await db.orm.public.Notification.all();

  const userNotifications = notifications.filter(
    (notification) =>
      notification.userId === userId &&
      !notification.isRead,
  );

  for (const notification of userNotifications) {
    await db.orm.public.Notification
      .where({ id: notification.id })
      .update({
        isRead: true,
      });
  }

  await broadcastUnreadCount(userId);

  return {
    updatedCount: userNotifications.length,
  };
}

async function broadcastUnreadCount(
  userId: string,
) {
  const unreadCount =
    await getUnreadNotificationCount(userId);

  const io = getSocketIO();

  io.to(`user:${userId}`).emit(
    "notification:unread-count",
    {
      unreadCount,
    },
  );
}
