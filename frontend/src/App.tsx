import { useEffect, useState } from "react";

import { useAuth } from "./context/AuthContext";
import { getDashboard, type AdminDashboard } from "./api/dashboard";
import {
  getActivityFeed,
  type Activity,
} from "./api/activity";
import { getSocket } from "./socket";
import Login from "./pages/Login";

export default function App() {
  const {
    user,
    isLoading: authLoading,
  } = useAuth();

  const [dashboard, setDashboard] =
    useState<AdminDashboard | null>(null);

  const [activities, setActivities] =
    useState<Activity[]>([]);

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [onlineUsers, setOnlineUsers] =
    useState(0);

  useEffect(() => {
    if (!user) {
      setDashboard(null);
      setActivities([]);
      setOnlineUsers(0);
      return;
    }

    async function loadDashboard() {
      try {
        setIsLoading(true);
        setError("");

        const [dashboardResult, activityResult] =
          await Promise.all([
            getDashboard(),
            getActivityFeed(),
          ]);

        setDashboard(
          dashboardResult.dashboard,
        );

        setOnlineUsers(
          dashboardResult.dashboard.onlineUsers ?? 0,
        );

        setActivities(activityResult);
      } catch (error) {
        console.error(error);

        setError(
          "Failed to load dashboard data.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadDashboard();
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const socket = getSocket();

    if (!socket) {
      return;
    }

    function handlePresenceUpdate(data: {
      onlineUsers: number;
    }) {
      setOnlineUsers(data.onlineUsers);
    }

    function handleActivityHistory(data: {
      projectId: string;
      activities: Activity[];
    }) {
      setActivities((currentActivities) => {
        const existingIds = new Set(
          currentActivities.map(
            (activity) => activity.id,
          ),
        );

        const newActivities =
          data.activities.filter(
            (activity) =>
              !existingIds.has(activity.id),
          );

        return [
          ...newActivities,
          ...currentActivities,
        ]
          .sort(
            (a, b) =>
              new Date(
                b.createdAt,
              ).getTime() -
              new Date(
                a.createdAt,
              ).getTime(),
          )
          .slice(0, 20);
      });
    }

    socket.on(
      "presence:update",
      handlePresenceUpdate,
    );

    socket.on(
      "activity:history",
      handleActivityHistory,
    );

    return () => {
      socket.off(
        "presence:update",
        handlePresenceUpdate,
      );

      socket.off(
        "activity:history",
        handleActivityHistory,
      );
    };
  }, [user]);

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Loading...
      </main>
    );
  }

  if (!user) {
    return <Login />;
  }

  const statusCounts =
    dashboard?.statusCounts ?? {
      TODO: 0,
      IN_PROGRESS: 0,
      IN_REVIEW: 0,
      DONE: 0,
    };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold">
              Velozity Dashboard
            </h1>

            <p className="text-sm text-slate-400">
              Real-Time Client Project Management
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold">
                {user.name}
              </p>

              <p className="text-xs text-slate-400">
                {user.role === "PROJECT_MANAGER"
                  ? "Project Manager"
                  : user.role === "DEVELOPER"
                    ? "Developer"
                    : "Administrator"}
              </p>
            </div>

            <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              {onlineUsers} Online
            </div>

            <button
              type="button"
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-200"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">
            Welcome, {user.name}
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            You are signed in as{" "}
            {user.role === "PROJECT_MANAGER"
              ? "Project Manager"
              : user.role === "DEVELOPER"
                ? "Developer"
                : "Administrator"}.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
            Loading dashboard...
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <DashboardCard
                title="Projects"
                value={
                  dashboard?.totalProjects ?? 0
                }
                subtitle="Total projects"
              />

              <DashboardCard
                title="Tasks"
                value={
                  dashboard?.totalTasks ?? 0
                }
                subtitle="Total tasks"
              />

              <DashboardCard
                title="Overdue"
                value={
                  dashboard?.overdueTasks ?? 0
                }
                subtitle="Overdue tasks"
              />

              <DashboardCard
                title="Online Users"
                value={onlineUsers}
                subtitle="WebSocket presence"
              />
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              <section className="rounded-xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Task Status
                    </h3>

                    <p className="text-sm text-slate-400">
                      Current task distribution
                    </p>
                  </div>

                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-400">
                    Live data
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <StatusCard
                    label="To Do"
                    value={statusCounts.TODO}
                  />

                  <StatusCard
                    label="In Progress"
                    value={
                      statusCounts.IN_PROGRESS
                    }
                  />

                  <StatusCard
                    label="In Review"
                    value={
                      statusCounts.IN_REVIEW
                    }
                  />

                  <StatusCard
                    label="Done"
                    value={statusCounts.DONE}
                  />
                </div>
              </section>

              <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <h3 className="text-lg font-semibold">
                  Notifications
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Real-time notification center
                </p>

                <div className="mt-5 rounded-lg border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
                  Notifications will load from the backend.
                </div>
              </section>
            </div>

            <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    Project Activity
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    Latest activity from PostgreSQL
                  </p>
                </div>

                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                  {activities.length} events
                </span>
              </div>

              {activities.length === 0 ? (
                <div className="mt-5 rounded-lg border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
                  No activity found.
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {activities.map(
                    (activity) => (
                      <ActivityItem
                        key={activity.id}
                        activity={activity}
                      />
                    ),
                  )}
                </div>
              )}
            </section>

            <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="text-lg font-semibold">
                Role-Based Access
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                {user.role === "ADMIN"
                  ? "You have access to all projects, tasks, users, activity, and dashboard statistics."
                  : user.role ===
                      "PROJECT_MANAGER"
                    ? "You can manage your own projects, assign tasks, and view team activity."
                    : "You can view and update your assigned tasks only."}
              </p>
            </section>
          </>
        )}
      </section>
    </main>
  );
}

type DashboardCardProps = {
  title: string;
  value: number;
  subtitle: string;
};

function DashboardCard({
  title,
  value,
  subtitle,
}: DashboardCardProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">
        {title}
      </p>

      <p className="mt-3 text-3xl font-bold">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {subtitle}
      </p>
    </div>
  );
}

type StatusCardProps = {
  label: string;
  value: number;
};

function StatusCard({
  label,
  value,
}: StatusCardProps) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}

type ActivityItemProps = {
  activity: Activity;
};

function ActivityItem({
  activity,
}: ActivityItemProps) {
  const formattedDate =
    new Date(
      activity.createdAt,
    ).toLocaleString();

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-200">
            {activity.action}
          </p>

          <p className="mt-1 text-sm text-slate-400">
            {activity.details}
          </p>
        </div>

        <span className="shrink-0 text-xs text-slate-500">
          {formattedDate}
        </span>
      </div>

      <div className="mt-3 flex gap-3 text-xs text-slate-600">
        <span>
          User: {activity.userId}
        </span>

        {activity.taskId && (
          <span>
            Task: {activity.taskId}
          </span>
        )}
      </div>
    </div>
  );
}
