import bcrypt from "bcrypt";
import { Temporal } from "@js-temporal/polyfill";
import { db } from "../../config/db.js";

import {
  createAccessToken,
  createRefreshToken,
  type JwtUserPayload,
} from "../../utils/jwt.js";

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export async function registerUser(input: RegisterInput) {
  const existingUser = await db.orm.public.User.first({
    email: input.email,
  });

  if (existingUser) {
    throw new Error("Email already registered");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await db.orm.public.User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    role: "DEVELOPER",
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function loginUser(input: LoginInput) {
  const user = await db.orm.public.User.first({
    email: input.email,
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const passwordValid = await bcrypt.compare(
    input.password,
    user.passwordHash,
  );

  if (!passwordValid) {
    throw new Error("Invalid email or password");
  }

  const payload: JwtUserPayload = {
    userId: user.id,
    role: user.role,
  };

  const accessToken = createAccessToken(payload);
  const refreshToken = createRefreshToken(payload);

  const tokenHash = await bcrypt.hash(refreshToken, 10);

  const expiresAt = Temporal.Instant.fromEpochMilliseconds(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  );

  await db.orm.public.RefreshToken.create({
    tokenHash,
    userId: user.id,
    expiresAt,
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
}
