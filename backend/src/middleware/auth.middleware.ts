import type { NextFunction, Request, Response } from "express";
import {
  verifyAccessToken,
  type JwtUserPayload,
} from "../utils/jwt.js";

export type AuthenticatedRequest = Request & {
  user?: JwtUserPayload;
};

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Access token is required",
    });
    return;
  }

  const token = authorization.substring(7);

  try {
    const payload = verifyAccessToken(token);

    req.user = payload;

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
    });
  }
}

export function authorizeRoles(
  ...allowedRoles: JwtUserPayload["role"][]
) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource",
      });
      return;
    }

    next();
  };
}