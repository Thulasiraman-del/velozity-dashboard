import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { getActivityFeed, type Activity } from "./api/activity";
import { getDashboard, type DashboardResponse } from "./api/dashboard";
import { getSocket } from "./socket";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import NotificationCenter from "./components/NotificationCenter";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";

function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");
        const result = await getDashboard(statusFilter || undefined, priorityFilter || undefined);
        setData(result);
      } catch {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    async function loadActivities() {
      try {
        const result = await getActivityFeed();
        setActivities(result);
      } catch {
        setActivities([]);
      } finally {
        setActivityLoading(false);
      }
    }

    void loadActivities();

    const socket = getSocket();

    if (!socket) {
      return;
    }

    function handleNewActivity(activity: Activity) {
      setActivities((current) => {
        const exists = current.some((item) => item.id === activity.id);

        if (exists) {
          return current;
        }

        return [activity, ...current].slice(0, 20);
      });
    }

    socket.on("activity:new", handleNewActivity);

    return () => {
      socket.off("activity:new", handleNewActivity);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-slate-400">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
        {error}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          {data.role === "DEVELOPER" ? "My Dashboard" : "Dashboard"}
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          Welcome back, {user?.name}.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Status</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            >
              <option value="">All Statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Priority</label>
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          {(statusFilter || priorityFilter) && (
            <button
              type="button"
              onClick={() => { setStatusFilter(""); setPriorityFilter(""); }}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {data.role === "ADMIN" && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard label="Projects" value={data.dashboard.totalProjects} />
            <StatCard label="Tasks" value={data.dashboard.totalTasks} />
            <StatCard
              label="Overdue"
              value={data.dashboard.overdueTasks}
              danger
            />
            <StatCard
              label="Online Users"
              value={data.dashboard.onlineUsers}
              highlight
            />
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Task Status
            </h2>

            <div className="grid gap-3 md:grid-cols-4">
              <StatusCard label="To Do" value={data.dashboard.statusCounts.TODO} />
              <StatusCard label="In Progress" value={data.dashboard.statusCounts.IN_PROGRESS} />
              <StatusCard label="In Review" value={data.dashboard.statusCounts.IN_REVIEW} />
              <StatusCard label="Done" value={data.dashboard.statusCounts.DONE} />
            </div>
          </div>
        </>
      )}

      {data.role === "PROJECT_MANAGER" && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Projects" value={data.dashboard.totalProjects} />
            <StatCard label="Tasks" value={data.dashboard.totalTasks} />
            <StatCard
              label="Upcoming This Week"
              value={data.dashboard.upcomingWeekTasks}
              highlight
            />
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Task Priority
            </h2>

            <div className="grid gap-3 md:grid-cols-4">
              <StatusCard label="Low" value={data.dashboard.priorityCounts.LOW} />
              <StatusCard label="Medium" value={data.dashboard.priorityCounts.MEDIUM} />
              <StatusCard label="High" value={data.dashboard.priorityCounts.HIGH} />
              <StatusCard label="Critical" value={data.dashboard.priorityCounts.CRITICAL} />
            </div>
          </div>
        </>
      )}

      {data.role === "DEVELOPER" && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <StatCard label="Assigned Tasks" value={data.dashboard.totalTasks} />
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-4 text-lg font-semibold text-white">
              My Tasks
            </h2>

            {data.dashboard.tasks.length === 0 ? (
              <p className="text-sm text-slate-400">
                No tasks assigned.
              </p>
            ) : (
              <div className="space-y-3">
                {data.dashboard.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-lg border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-medium text-white">
                          {task.title}
                        </h3>

                        <p className="mt-1 text-sm text-slate-400">
                          {task.description || "No description"}
                        </p>
                      </div>

                      <span className="rounded-full bg-lime-400/10 px-3 py-1 text-xs font-medium text-lime-300">
                        {task.priority}
                      </span>
                    </div>

                    <div className="mt-3 flex gap-4 text-xs text-slate-500">
                      <span>{task.status}</span>
                      <span>
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Live Activity Feed
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Latest activity from your permitted projects and tasks.
            </p>
          </div>

          <span className="rounded-full bg-lime-400/10 px-3 py-1 text-xs font-medium text-lime-300">
            Live
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {activityLoading ? (
            <p className="text-sm text-slate-400">
              Loading activity...
            </p>
          ) : activities.length === 0 ? (
            <p className="text-sm text-slate-400">
              No activity yet.
            </p>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="rounded-lg border border-slate-800 bg-slate-950 p-4"
              >
                <p className="font-medium text-white">
                  {activity.details}
                </p>

                <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>{activity.action}</span>
                  <span>
                    {new Date(activity.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  danger = false,
  highlight = false,
}: {
  label: string;
  value: number;
  danger?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{label}</p>

      <p
        className={`mt-2 text-3xl font-bold ${
          danger
            ? "text-red-400"
            : highlight
              ? "text-lime-400"
              : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg bg-slate-950 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const links = [
    { path: "/", label: "Dashboard" },
    ...(user.role !== "DEVELOPER" ? [{ path: "/projects", label: "Projects" }] : []),
    { path: "/tasks", label: "Tasks" },
  ];

  async function handleLogout() {
    await logout();
  }

  return (
    <div className="min-h-screen bg-[#0b0f14] text-white">
            <header className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="font-bold text-lime-400">
              Velozity Dashboard
            </h1>
            <p className="text-xs text-slate-500">
              {user.role}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <NotificationCenter />

            <button
              onClick={() => void handleLogout()}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        <aside className="min-h-[calc(100vh-73px)] w-56 border-r border-slate-800 p-4">
          <nav className="space-y-2">
            {links.map((link) => {
              const active = location.pathname === link.path;

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block rounded-lg px-4 py-3 text-sm ${
                    active
                      ? "bg-lime-400 font-semibold text-slate-950"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={user.role === "DEVELOPER" ? <Navigate to="/" replace /> : <Projects />} />
            <Route path="/tasks" element={<Tasks />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<Layout />} />
    </Routes>
  );
}







