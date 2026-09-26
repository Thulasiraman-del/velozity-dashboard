import { useEffect, useState } from "react";
import { getTasks, updateTaskStatus, type Task, type TaskStatus } from "../api/tasks";
import { getSocket } from "../socket";

const statuses: TaskStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
];

function formatStatus(status: TaskStatus): string {
  return status.replace("_", " ");
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString();
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTasks() {
    try {
      setError("");
      const data = await getTasks();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTasks();

    const socket = getSocket();

    if (!socket) {
      return;
    }

    function handleStatusUpdate(event: {
      taskId: string;
      projectId: string;
      status: TaskStatus;
    }) {
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === event.taskId
            ? { ...task, status: event.status }
            : task,
        ),
      );
    }

    socket.on("task:status-updated", handleStatusUpdate);

    return () => {
      socket.off("task:status-updated", handleStatusUpdate);
    };
  }, []);

  async function handleStatusChange(
    taskId: string,
    status: TaskStatus,
  ) {
    try {
      const updatedTask = await updateTaskStatus(taskId, status);

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === updatedTask.id ? updatedTask : task,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update task status",
      );
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-300">
        Loading tasks...
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-lime-400">
          Task Management
        </p>

        <h2 className="mt-2 text-2xl font-bold text-white">
          Tasks
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Manage task status and monitor assigned work.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
          No tasks available for your role.
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <article
              key={task.id}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {task.title}
                  </h3>

                  {task.description && (
                    <p className="mt-1 text-sm text-slate-400">
                      {task.description}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">
                      Priority: {task.priority}
                    </span>

                    <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">
                      Due: {formatDate(task.dueDate)}
                    </span>
                  </div>
                </div>

                <div className="min-w-48">
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Status
                  </label>

                  <select
                    value={task.status}
                    onChange={(event) =>
                      void handleStatusChange(
                        task.id,
                        event.target.value as TaskStatus,
                      )
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-lime-400"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {formatStatus(status)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
