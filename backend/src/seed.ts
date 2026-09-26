import bcrypt from "bcrypt";
import { Temporal } from "@js-temporal/polyfill";

import { db } from "./config/db.js";

async function findOrCreateUser(
  name: string,
  email: string,
  password: string,
  role:
    | "ADMIN"
    | "PROJECT_MANAGER"
    | "DEVELOPER",
) {
  const existing =
    await db.orm.public.User.first({
      email,
    });

  if (existing) {
    return existing;
  }

  const passwordHash =
    await bcrypt.hash(password, 10);

  return await db.orm.public.User.create({
    name,
    email,
    passwordHash,
    role,
  });
}

async function main() {
  console.log("Starting Velozity seed...");

  // ==================================================
  // USERS
  // ==================================================

  const admin =
    await findOrCreateUser(
      "Admin User",
      "admin@velozity.com",
      "Admin@12345",
      "ADMIN",
    );

  const pm1 =
    await findOrCreateUser(
      "Project Manager One",
      "pm1@velozity.com",
      "PM@12345",
      "PROJECT_MANAGER",
    );

  const pm2 =
    await findOrCreateUser(
      "Project Manager Two",
      "pm2@velozity.com",
      "PM2@12345",
      "PROJECT_MANAGER",
    );

  const developers = [];

  for (let i = 1; i <= 4; i++) {
    const developer =
      await findOrCreateUser(
        `Developer ${i}`,
        `developer${i}@velozity.com`,
        i === 1
          ? "Dev@12345"
          : `Dev${i}@12345`,
        "DEVELOPER",
      );

    developers.push(developer);
  }

  console.log("Users ready.");

  // ==================================================
  // PROJECTS
  // ==================================================

  const projectData = [
    {
      name: "E-Commerce Platform",
      description:
        "Client e-commerce platform development",
      clientName: "Acme Retail",
      managerId: pm1.id,
    },
    {
      name: "Banking Dashboard",
      description:
        "Real-time banking analytics dashboard",
      clientName: "Global Finance",
      managerId: pm1.id,
    },
    {
      name: "Healthcare Portal",
      description:
        "Healthcare client management portal",
      clientName: "MediCare Solutions",
      managerId: pm2.id,
    },
  ];

  const projects = [];

  for (const data of projectData) {
    const existingProjects =
      await db.orm.public.Project.all();

    const existing =
      existingProjects.find(
        (project) =>
          project.name === data.name,
      );

    if (existing) {
      projects.push(existing);
    } else {
      const project =
        await db.orm.public.Project.create(
          data,
        );

      projects.push(project);
    }
  }

  console.log(
    `Projects ready: ${projects.length}`,
  );

  // ==================================================
  // TASKS
  // ==================================================

  const now =
    Temporal.Now.instant();

  const taskTemplates = [
    {
      title: "Design database schema",
      priority: "HIGH" as const,
      daysFromNow: 3,
    },
    {
      title: "Build REST API",
      priority: "CRITICAL" as const,
      daysFromNow: 5,
    },
    {
      title: "Implement authentication",
      priority: "HIGH" as const,
      daysFromNow: 7,
    },
    {
      title: "Write automated tests",
      priority: "MEDIUM" as const,
      daysFromNow: 10,
    },
    {
      title: "Prepare deployment",
      priority: "LOW" as const,
      daysFromNow: 14,
    },
  ];

  const createdTasks = [];

  for (
    let projectIndex = 0;
    projectIndex < projects.length;
    projectIndex++
  ) {
    const project =
      projects[projectIndex];

    const existingTasks =
      await db.orm.public.Task.all();

    const projectTasks =
      existingTasks.filter(
        (task) =>
          task.projectId === project.id,
      );

    for (
      let taskIndex = 0;
      taskIndex < taskTemplates.length;
      taskIndex++
    ) {
      const template =
        taskTemplates[taskIndex];

      const taskTitle =
        `${template.title} - ${project.name}`;

      const existing =
        projectTasks.find(
          (task) =>
            task.title === taskTitle,
        );

      if (existing) {
        createdTasks.push(existing);
        continue;
      }

      // ----------------------------------------------
      // Create two overdue tasks
      // ----------------------------------------------

      const firstOverdueTask =
        projectIndex === 0 &&
        taskIndex === 0;

      const secondOverdueTask =
        projectIndex === 1 &&
        taskIndex === 0;

      let dueDate: Temporal.Instant;

      if (
        firstOverdueTask ||
        secondOverdueTask
      ) {
        // 48 hours in the past
        dueDate = now.subtract({
          hours: 48,
        });
      } else {
        // Future due date
        dueDate = now.add({
          hours:
            template.daysFromNow * 24,
        });
      }

      // ----------------------------------------------
      // Assign developers
      // ----------------------------------------------

      const developer =
        developers[
          (projectIndex * 2 +
            taskIndex) %
            developers.length
        ];

      // ----------------------------------------------
      // Create task
      // ----------------------------------------------

      const task =
        await db.orm.public.Task.create({
          title: taskTitle,

          description:
            `Seed task for ${project.name}`,

          projectId:
            project.id,

          developerId:
            developer.id,

          status:
            taskIndex === 4
              ? "DONE"
              : taskIndex === 1
                ? "IN_PROGRESS"
                : "TODO",

          priority:
            template.priority,

          dueDate,

          isOverdue:
            firstOverdueTask ||
            secondOverdueTask,
        });

      createdTasks.push(task);
    }
  }

  console.log(
    `Tasks ready: ${createdTasks.length}`,
  );

  // ==================================================
  // ACTIVITY LOGS
  // ==================================================

  const existingActivities =
    await db.orm.public.ActivityLog.all();

  for (
    const task of createdTasks.slice(
      0,
      10,
    )
  ) {
    const alreadyLogged =
      existingActivities.some(
        (activity) =>
          activity.taskId === task.id &&
          activity.action ===
            "SEED_TASK_CREATED",
      );

    if (alreadyLogged) {
      continue;
    }

    await db.orm.public.ActivityLog.create({
      userId: admin.id,

      projectId:
        task.projectId,

      taskId:
        task.id,

      action:
        "SEED_TASK_CREATED",

      details:
        `Seed activity created for task "${task.title}"`,
    });
  }

  console.log(
    "Activity logs ready.",
  );

  console.log(
    "Velozity seed completed successfully.",
  );
}

main()
  .catch((error) => {
    console.error(
      "Seed failed:",
      error,
    );

    process.exit(1);
  });