import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function connectSocket(
  accessToken: string,
): Socket {
  if (socket?.connected) {
    return socket;
  }

  socket = io(
    import.meta.env.VITE_SOCKET_URL ??
      "http://localhost:5000",
    {
      auth: {
        token: accessToken,
      },
      withCredentials: true,
    },
  );

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
