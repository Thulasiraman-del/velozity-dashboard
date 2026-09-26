import apiClient from "./client";

export type UserRole =
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "DEVELOPER";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type LoginResponse = {
  success: boolean;
  message: string;
  user: User;
  accessToken: string;
};

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(
    "/auth/login",
    {
      email,
      password,
    },
  );

  return response.data;
}

export async function refreshAccessToken(): Promise<string> {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    accessToken: string;
  }>("/auth/refresh");

  return response.data.accessToken;
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<{
    success: boolean;
    user: User;
  }>("/auth/me");

  return response.data.user;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}
