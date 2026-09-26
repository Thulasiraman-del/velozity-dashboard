import { createServer } from "node:http";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";

import authRoutes from "./routes/auth/auth.routes.js";
import projectRoutes from "./routes/project.routes.js";
import taskRoutes from "./routes/task.routes.js";
import userRoutes from "./routes/user.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

import {
  authenticate,
  authorizeRoles,
  type AuthenticatedRequest,
} from "./middleware/auth.middleware.js";

import { initializeSocket } from "./websocket/socket.js";
import { startOverdueTasksJob } from "./jobs/overdue-tasks.job.js";

const app = express();

app.use(
  cors({
    origin:
      process.env["FRONTEND_URL"] ??
      "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

// Authentication routes
app.use("/api/auth", authRoutes);

// Project routes
app.use("/api/projects", projectRoutes);

// Task routes
app.use("/api/tasks", taskRoutes);

// User routes
app.use("/api/users", userRoutes);

// Activity routes
app.use("/api/activities", activityRoutes);

// Notification routes
app.use("/api/notifications", notificationRoutes);

// Dashboard routes
app.use("/api/dashboard", dashboardRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Velozity Dashboard API is running",
  });
});

// Admin-only test route
app.get(
  "/api/admin/test",
  authenticate,
  authorizeRoles("ADMIN"),
  (req: AuthenticatedRequest, res) => {
    res.json({
      success: true,
      message: "Admin access granted",
      user: req.user,
    });
  },
);

const PORT = Number(
  process.env["PORT"] ?? 5000,
);

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
initializeSocket(httpServer);

// Start overdue task background job
startOverdueTasksJob();

// Start server
httpServer.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`,
  );
  console.log(
    "Socket.IO server initialized",
  );
});