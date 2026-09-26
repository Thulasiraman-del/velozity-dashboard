
import cron from "node-cron";

import { db } from "../config/db.js";

export function startOverdueTasksJob() {
  // Run every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    console.log(
      "Overdue job execution started:",
      new Date().toISOString(),
    );

    try {
      const tasks = await db.orm.public.Task.all();

      const now = Date.now();

      let markedOverdue = 0;
      let clearedOverdue = 0;

      for (const task of tasks) {
        const isPastDue =
          task.dueDate.epochMilliseconds < now &&
          task.status !== "DONE";

        // Mark overdue tasks
        if (isPastDue && !task.isOverdue) {
          await db.orm.public.Task
            .where({ id: task.id })
            .update({
              isOverdue: true,
            });

          markedOverdue++;

          console.log(
            `Task marked overdue: ${task.id} - ${task.title}`,
          );
        }

        // Clear overdue flag if task is no longer overdue
        if (!isPastDue && task.isOverdue) {
          await db.orm.public.Task
            .where({ id: task.id })
            .update({
              isOverdue: false,
            });

          clearedOverdue++;

          console.log(
            `Task overdue flag cleared: ${task.id} - ${task.title}`,
          );
        }
      }

      console.log(
        `Overdue job completed. Checked: ${tasks.length}, ` +
        `marked overdue: ${markedOverdue}, ` +
        `cleared overdue: ${clearedOverdue}`,
      );
    } catch (error) {
      console.error("Overdue task job failed:", error);
    }
  });

  console.log("Overdue task background job started");
}
