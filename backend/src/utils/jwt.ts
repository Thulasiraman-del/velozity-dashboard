import jwt from "jsonwebtoken";

const accessSecret: string = process.env["JWT_ACCESS_SECRET"] ?? "";
const refreshSecret: string = process.env["JWT_REFRESH_SECRET"] ?? "";

if (!accessSecret || !refreshSecret) {
  throw new Error("JWT secrets are not configured");
}

export type JwtUserPayload = {
  userId: string;
  role: "ADMIN" | "PROJECT_MANAGER" | "DEVELOPER";
};

export function createAccessToken(payload: JwtUserPayload): string {
  return jwt.sign(payload, accessSecret, {
    expiresIn: "15m",
  });
}

export function createRefreshToken(payload: JwtUserPayload): string {
  return jwt.sign(payload, refreshSecret, {
    expiresIn: "7d",
  });
}

function parsePayload(decoded: string | jwt.JwtPayload): JwtUserPayload {
  if (
    typeof decoded !== "object" ||
    typeof decoded.userId !== "string" ||
    !["ADMIN", "PROJECT_MANAGER", "DEVELOPER"].includes(
      decoded.role as string,
    )
  ) {
    throw new Error("Invalid JWT payload");
  }

  return {
    userId: decoded.userId,
    role: decoded.role as JwtUserPayload["role"],
  };
}

export function verifyAccessToken(token: string): JwtUserPayload {
  return parsePayload(jwt.verify(token, accessSecret));
}

export function verifyRefreshToken(token: string): JwtUserPayload {
  return parsePayload(jwt.verify(token, refreshSecret));
}