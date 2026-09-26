
import { db } from "./config/db.js";

const TEST_TASK_TITLES = [
  "Notification Test Task",
  "Live Notification Test",
  "PM Live Notification Test",
];

const TEST_TASK_IDS = [
  "a516d1bc-b779-497c-b56c-c4ee12bfdfc9",
  "722b2181-a4c4-4726-97e8-aa0f60397910",
  "3c6c3b36-8968-4247-a249-641862170b5e",
  "e9e8f9db-f9c2-4428-9cb2-0eab4326fd40",
];

const TEST_PROJECT_IDS = [
  // Older test projects
  "3de87132-ca56-41f7-8a20-b100e813ef18",
  "38fcbb99-cfe6-42c7-9b11-7c763459a795",

  // Current test projects
  "76fb907a-affc-4efe-931e-36cecd25d8eb",
  "98edccfc-92ca-4532-9eac-605c06bc61a4",
];

const TEST_USER_EMAILS = [
  "securitytest@velozity.com",
  "securitytest2@velozity.com",
];

async function main() {
  console.log("Starting targeted test-data cleanup...");

  // --------------------------------------------------
  // Find all tasks
  // --------------------------------------------------

  const allTasks = await db.orm.public.Task.all();

  // Find test tasks by their known test titles
  const titleMatchedTasks = allTasks.filter((task) =>
    TEST_TASK_TITLES.includes(task.title),
  );

  // Find remaining known test tasks by ID
  const idMatchedTasks = allTasks.filter((task) =>
    TEST_TASK_IDS.includes(task.id),
  );

  // Combine both lists without duplicates
  const testTaskMap = new Map(
    [...titleMatchedTasks, ...idMatchedTasks].map((task) => [
      task.id,
      task,
    ]),
  );

  const testTasks = [...testTaskMap.values()];

  console.log(`Test tasks found: ${testTasks.length}`);

  // --------------------------------------------------
  // Delete activity logs belonging to test tasks
  // --------------------------------------------------

  const allActivities =
    await db.orm.public.ActivityLog.all();

  for (const task of testTasks) {
    const taskActivities = allActivities.filter(
      (activity) => activity.taskId === task.id,
    );

    for (const activity of taskActivities) {
      await db.orm.public.ActivityLog
        .where({ id: activity.id })
        .delete();
    }
  }

  // --------------------------------------------------
  // Delete test tasks
  // --------------------------------------------------

  for (const task of testTasks) {
    await db.orm.public.Task
      .where({ id: task.id })
      .delete();

    console.log(`Deleted test task: ${task.title}`);
  }

  // --------------------------------------------------
  // Delete security-test users
  // --------------------------------------------------

  const allUsers = await db.orm.public.User.all();

  const testUsers = allUsers.filter((user) =>
    TEST_USER_EMAILS.includes(user.email),
  );

  for (const user of testUsers) {
    // Delete refresh tokens
    const tokens =
      await db.orm.public.RefreshToken.all();

    for (const token of tokens.filter(
      (item) => item.userId === user.id,
    )) {
      await db.orm.public.RefreshToken
        .where({ id: token.id })
        .delete();
    }

    // Delete notifications
    const notifications =
      await db.orm.public.Notification.all();

    for (const notification of notifications.filter(
      (item) => item.userId === user.id,
    )) {
      await db.orm.public.Notification
        .where({ id: notification.id })
        .delete();
    }

    // Delete activity logs created by the test user
    const activities =
      await db.orm.public.ActivityLog.all();

    for (const activity of activities.filter(
      (item) => item.userId === user.id,
    )) {
      await db.orm.public.ActivityLog
        .where({ id: activity.id })
        .delete();
    }

    // Delete the test user
    await db.orm.public.User
      .where({ id: user.id })
      .delete();

    console.log(`Deleted test user: ${user.email}`);
  }

  // --------------------------------------------------
  // Delete empty test projects
  // --------------------------------------------------

  const projectActivities =
    await db.orm.public.ActivityLog.all();

  for (const projectId of TEST_PROJECT_IDS) {
    const activities = projectActivities.filter(
      (activity) => activity.projectId === projectId,
    );

    // Delete activity logs belonging to the test project
    for (const activity of activities) {
      await db.orm.public.ActivityLog
        .where({ id: activity.id })
        .delete();
    }

    // Delete the test project
    await db.orm.public.Project
      .where({ id: projectId })
      .delete();

    console.log(`Deleted test project: ${projectId}`);
  }

  console.log("Targeted test-data cleanup completed.");
}

main()
  .catch((error) => {
    console.error("Cleanup failed:", error);
    process.exit(1);
  });
