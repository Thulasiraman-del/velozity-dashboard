import { db } from "../config/db.js";

export async function getDevelopers() {
  const users = await db.orm.public.User.all();

  return users
    .filter((user) => user.role === "DEVELOPER")
    .map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }));
}

export async function getUserById(userId: string) {
  const users = await db.orm.public.User.all();

  const user = users.find((item) => item.id === userId);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
