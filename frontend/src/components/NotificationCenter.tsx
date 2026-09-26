import { useEffect, useState } from "react";
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead, type Notification } from "../api/notifications";
import { getSocket } from "../socket";

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void getNotifications()
      .then((items) => {
        setNotifications(items);
        setUnreadCount(items.filter((item) => !item.isRead).length);
      })
      .catch(console.error);

    const socket = getSocket();
    if (!socket) return;

    const handleNew = (notification: Notification) => {
      setNotifications((current) =>
        [notification, ...current.filter((item) => item.id !== notification.id)].slice(0, 20)
      );
    };

    const handleUnread = (data: { unreadCount: number }) => {
      setUnreadCount(data.unreadCount);
    };

    socket.on("notification:new", handleNew);
    socket.on("notification:unread-count", handleUnread);

    return () => {
      socket.off("notification:new", handleNew);
      socket.off("notification:unread-count", handleUnread);
    };
  }, []);

  async function markRead(id: string) {
    try {
      const updated = await markNotificationAsRead(id);
      setNotifications((current) =>
        current.map((item) => item.id === id ? updated : item)
      );
    } catch (error) {
      console.error(error);
    }
  }

  async function markAllRead() {
    try {
      await markAllNotificationsAsRead();
      setNotifications((current) =>
        current.map((item) => ({ ...item, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
      >
        Notifications
        {unreadCount > 0 && (
          <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-96 rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">Notifications</h3>
              <p className="text-xs text-slate-400">{unreadCount} unread</p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 space-y-2 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No notifications
              </p>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => {
                    if (!notification.isRead) {
                      void markRead(notification.id);
                    }
                  }}
                  className={`w-full rounded-lg border p-3 text-left ${
                    notification.isRead
                      ? "border-slate-800 bg-slate-950"
                      : "border-blue-500/30 bg-blue-500/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-slate-200">
                      {notification.message}
                    </p>

                    {!notification.isRead && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                    )}
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
