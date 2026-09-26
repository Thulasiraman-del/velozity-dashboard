
import { io } from "socket.io-client";

const token = process.env.DEVELOPER_TOKEN;

if (!token) {
  console.error("DEVELOPER_TOKEN is missing");
  process.exit(1);
}

const socket = io("http://localhost:5000", {
  auth: {
    token,
  },
});

socket.on("connect", () => {
  console.log("CONNECTED:", socket.id);

  socket.emit("project:join", {
    projectId: "98edccfc-92ca-4532-9eac-605c06bc61a4",
  });
});

socket.on("connect_error", (error) => {
  console.error("CONNECT ERROR:", error.message);
});

socket.on("presence:update", (data) => {
  console.log("PRESENCE:");
  console.log(JSON.stringify(data, null, 2));
});

socket.on("activity:history", (data) => {
  console.log("ACTIVITY HISTORY:");
  console.log(JSON.stringify(data, null, 2));
});

socket.on("activity:new", (data) => {
  console.log("LIVE ACTIVITY:");
  console.log(JSON.stringify(data, null, 2));
});

socket.on("task:status-updated", (data) => {
  console.log("LIVE TASK UPDATE:");
  console.log(JSON.stringify(data, null, 2));
});

socket.on("notification:new", (data) => {
  console.log("LIVE NOTIFICATION:");
  console.log(JSON.stringify(data, null, 2));
});

socket.on("notification:unread-count", (data) => {
  console.log("LIVE UNREAD COUNT:");
  console.log(JSON.stringify(data, null, 2));
});

socket.on("project:error", (data) => {
  console.error("PROJECT ERROR:");
  console.error(JSON.stringify(data, null, 2));
});
