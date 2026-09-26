
import { Server as HttpServer } from "node:http";

import { Server } from "socket.io";

import {
  verifyAccessToken,
  type JwtUserPayload,
} from "../utils/jwt.js";

import { db } from "../config/db.js";
import { getProjectActivities } from "../services/activity.service.js";

type ProjectRoomPayload = {
  projectId?: string;
};

let io: Server | null = null;

// userId -> number of active socket connections
const onlineUsers = new Map<string, number>();

async function canAccessProject(
  user: JwtUserPayload,
  projectId: string,
): Promise<boolean> {
  const project = await db.orm.public.Project.first({
    id: projectId,
  });

  if (!project) {
    return false;
  }

  // Admin can view every project.
  if (user.role === "ADMIN") {
    return true;
  }

  // Project Manager can view only their own projects.
  if (user.role === "PROJECT_MANAGER") {
    return project.managerId === user.userId;
  }

  // Developer can view a project only if they
  // have a task assigned to them in that project.
  if (user.role === "DEVELOPER") {
    const tasks = await db.orm.public.Task.all();

    return tasks.some(
      (task) =>
        task.projectId === projectId &&
        task.developerId === user.userId,
    );
  }

  return false;
}

// Get number of unique online users.
export function getOnlineUserCount(): number {
  return onlineUsers.size;
}

function broadcastOnlineCount(): void {
  if (!io) {
    return;
  }

  io.emit("presence:update", {
    onlineUsers: getOnlineUserCount(),
  });
}

function addOnlineUser(userId: string): void {
  const currentCount =
    onlineUsers.get(userId) ?? 0;

  onlineUsers.set(
    userId,
    currentCount + 1,
  );

  broadcastOnlineCount();
}

function removeOnlineUser(userId: string): void {
  const currentCount =
    onlineUsers.get(userId);

  if (!currentCount) {
    return;
  }

  if (currentCount === 1) {
    onlineUsers.delete(userId);
  } else {
    onlineUsers.set(
      userId,
      currentCount - 1,
    );
  }

  broadcastOnlineCount();
}

export function initializeSocket(
  server: HttpServer,
) {
  io = new Server(server, {
    cors: {
      origin:
        process.env["FRONTEND_URL"] ??
        "http://localhost:5173",
      credentials: true,
    },
  });

  // Authenticate every Socket.IO connection.
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token;

      if (
        !token ||
        typeof token !== "string"
      ) {
        return next(
          new Error(
            "Access token is required",
          ),
        );
      }

      const user =
        verifyAccessToken(token);

      socket.data.user = user;

      next();
    } catch {
      next(
        new Error(
          "Invalid or expired access token",
        ),
      );
    }
  });

  io.on("connection", (socket) => {
    const user =
      socket.data.user as JwtUserPayload;

    addOnlineUser(user.userId);

    // Personal room.
    //
    // Used for:
    // - user-specific notifications
    // - developer-specific task events
    // - developer-specific activity events
    socket.join(
      `user:${user.userId}`,
    );

    // Admin receives global activity events.
    if (user.role === "ADMIN") {
      socket.join("role:ADMIN");
    }

    console.log(
      `Socket connected: ${socket.id} | User: ${user.userId} | Role: ${user.role}`,
    );

    // Send current presence count
    // to the newly connected user.
    socket.emit(
      "presence:update",
      {
        onlineUsers:
          getOnlineUserCount(),
      },
    );

    // Join a project room.
    socket.on(
      "project:join",
      async ({
        projectId,
      }: ProjectRoomPayload) => {
        try {
          if (!projectId) {
            socket.emit(
              "project:error",
              {
                message:
                  "Project ID is required",
              },
            );

            return;
          }

          const allowed =
            await canAccessProject(
              user,
              projectId,
            );

          if (!allowed) {
            socket.emit(
              "project:error",
              {
                message:
                  "You do not have permission to view this project",
              },
            );

            return;
          }

          const roomName =
            `project:${projectId}`;

          /*
           * IMPORTANT RBAC RULE:
           *
           * Admin and Project Manager:
           *   Join the project room.
           *
           * Developer:
           *   DO NOT join the project room.
           *   Developers use their personal room instead.
           *
           * This prevents a developer from receiving
           * activity events belonging to other developers.
           */
          if (
            user.role === "ADMIN" ||
            user.role === "PROJECT_MANAGER"
          ) {
            socket.join(roomName);

            console.log(
              `User ${user.userId} joined project room ${roomName}`,
            );
          } else {
            console.log(
              `Developer ${user.userId} authorized for project ${projectId} without joining project room`,
            );
          }

          // Send latest 20 activities from PostgreSQL.
          //
          // Developers receive only activity for
          // their assigned tasks.
          const activities =
            await getProjectActivities(
              projectId,
              user.userId,
              user.role,
            );

          socket.emit(
            "activity:history",
            {
              projectId,
              activities,
            },
          );
        } catch {
          socket.emit(
            "project:error",
            {
              message:
                "Failed to join project",
            },
          );
        }
      },
    );

    // Leave a project room.
    socket.on(
      "project:leave",
      ({
        projectId,
      }: ProjectRoomPayload) => {
        if (!projectId) {
          return;
        }

        const roomName =
          `project:${projectId}`;

        socket.leave(roomName);

        console.log(
          `User ${user.userId} left project room ${roomName}`,
        );
      },
    );

    // Handle socket disconnect.
    socket.on(
      "disconnect",
      () => {
        removeOnlineUser(
          user.userId,
        );

        console.log(
          `Socket disconnected: ${socket.id} | User: ${user.userId} | Role: ${user.role}`,
        );
      },
    );
  });

  return io;
}

export function getSocketIO(): Server {
  if (!io) {
    throw new Error(
      "Socket.IO has not been initialized",
    );
  }

  return io;
}
