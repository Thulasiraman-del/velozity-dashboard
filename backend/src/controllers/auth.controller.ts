import type { Request, Response } from "express";
import bcrypt from "bcrypt";

import {
  loginUser,
  registerUser,
  type LoginInput,
  type RegisterInput,
} from "../services/auth/auth.service.js";

import { getUserById } from "../services/user.service.js";
import { db } from "../config/db.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export async function registerController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const input = req.body as RegisterInput;

    const user = await registerUser(input);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Registration failed";

    res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function loginController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const input = req.body as LoginInput;

    const result = await loginUser(input);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Login failed";

    res.status(401).json({
      success: false,
      message,
    });
  }
}

export async function meController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const user = await getUserById(req.user.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to get current user",
    });
  }
}

export async function logoutController(
  req: Request,
  res: Response,
): Promise<void> {
  const refreshToken = req.cookies?.refreshToken;

  try {
    if (refreshToken) {
      const storedTokens = await db.orm.public.RefreshToken.all();

      for (const storedToken of storedTokens) {
        const matches = await bcrypt.compare(
          refreshToken,
          storedToken.tokenHash,
        );

        if (matches) {
          await db.orm.public.RefreshToken
            .where({ id: storedToken.id })
            .delete();

          break;
        }
      }
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "strict",
    });

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
}
