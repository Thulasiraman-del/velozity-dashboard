import { db } from "../config/db.js";
import { getOnlineUserCount } from "../websocket/socket.js";

export type DashboardRole =
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "DEVELOPER";

export type DashboardFilters = {
  status?: string;
  priority?: string;
};

const VALID_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
] as const;

const VALID_PRIORITIES = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const;

function isValidStatus(
  value: string,
): boolean {
  return VALID_STATUSES.includes(
    value as (typeof VALID_STATUSES)[number],
  );
}

function isValidPriority(
  value: string,
): boolean {
  return VALID_PRIORITIES.includes(
    value as (typeof VALID_PRIORITIES)[number],
  );
}

function filterTasks(
  tasks: any[],
  filters: DashboardFilters,
) {
  let filteredTasks = tasks;

  if (
    filters.status &&
    isValidStatus(filters.status)
  ) {
    filteredTasks =
      filteredTasks.filter(
        (task) =>
          task.status ===
          filters.status,
      );
  }

  if (
    filters.priority &&
    isValidPriority(filters.priority)
  ) {
    filteredTasks =
      filteredTasks.filter(
        (task) =>
          task.priority ===
          filters.priority,
      );
  }

  return filteredTasks;
}

// ==================================================
// ADMIN DASHBOARD
// ==================================================

export async function getAdminDashboard(
  filters: DashboardFilters = {},
) {
  const projects =
    await db.orm.public.Project.all();

  const tasks =
    await db.orm.public.Task.all();

  const filteredTasks =
    filterTasks(
      tasks,
      filters,
    );

  const statusCounts = {
    TODO: 0,
    IN_PROGRESS: 0,
    IN_REVIEW: 0,
    DONE: 0,
  };

  for (
    const task of filteredTasks
  ) {
    if (
      task.status in
      statusCounts
    ) {
      statusCounts[
        task.status as keyof typeof statusCounts
      ]++;
    }
  }

  const overdueTasks =
    filteredTasks.filter(
      (task) =>
        task.isOverdue,
    ).length;

  return {
    totalProjects:
      projects.length,

    totalTasks:
      filteredTasks.length,

    statusCounts,

    overdueTasks,

    onlineUsers:
      getOnlineUserCount(),
  };
}

// ==================================================
// PROJECT MANAGER DASHBOARD
// ==================================================

export async function getProjectManagerDashboard(
  managerId: string,
  filters: DashboardFilters = {},
) {
  const projects =
    await db.orm.public.Project.all();

  const ownProjects =
    projects.filter(
      (project) =>
        project.managerId ===
        managerId,
    );

  const projectIds =
    new Set(
      ownProjects.map(
        (project) =>
          project.id,
      ),
    );

  const allTasks =
    await db.orm.public.Task.all();

  const ownTasks =
    allTasks.filter(
      (task) =>
        projectIds.has(
          task.projectId,
        ),
    );

  const filteredTasks =
    filterTasks(
      ownTasks,
      filters,
    );

  const priorityCounts = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0,
  };

  for (
    const task of filteredTasks
  ) {
    if (
      task.priority in
      priorityCounts
    ) {
      priorityCounts[
        task.priority as keyof typeof priorityCounts
      ]++;
    }
  }

  const now =
    Date.now();

  const nextWeek =
    now +
    7 *
      24 *
      60 *
      60 *
      1000;

  const upcomingWeekTasks =
    filteredTasks
      .filter((task) => {
        const dueDate =
          task.dueDate
            .epochMilliseconds;

        return (
          dueDate >= now &&
          dueDate <= nextWeek
        );
      })
      .sort(
        (a, b) =>
          a.dueDate
            .epochMilliseconds -
          b.dueDate
            .epochMilliseconds,
      );

  return {
    totalProjects:
      ownProjects.length,

    totalTasks:
      filteredTasks.length,

    priorityCounts,

    upcomingWeekTasks,
  };
}

// ==================================================
// DEVELOPER DASHBOARD
// ==================================================

const priorityOrder:
  Record<string, number> = {
    CRITICAL: 1,
    HIGH: 2,
    MEDIUM: 3,
    LOW: 4,
  };

export async function getDeveloperDashboard(
  developerId: string,
  filters: DashboardFilters = {},
) {
  const tasks =
    await db.orm.public.Task.all();

  const assignedTasks =
    tasks.filter(
      (task) =>
        task.developerId ===
        developerId,
    );

  const filteredTasks =
    filterTasks(
      assignedTasks,
      filters,
    );

  filteredTasks.sort(
    (a, b) => {
      const priorityDifference =
        priorityOrder[
          a.priority
        ] -
        priorityOrder[
          b.priority
        ];

      if (
        priorityDifference !== 0
      ) {
        return priorityDifference;
      }

      return (
        a.dueDate
          .epochMilliseconds -
        b.dueDate
          .epochMilliseconds
      );
    },
  );

  return {
    totalTasks:
      filteredTasks.length,

    tasks:
      filteredTasks,
  };
}