import type { Request, Response } from "express";
import bcrypt from "bcrypt";

import {
  verifyRefreshToken,
  createAccessToken,
} from "../utils/jwt.js";

import { db } from "../config/db.js";

export async function refreshTokenController(
  req: Request,
  res: Response,
): Promise<void> {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    res.status(401).json({
      success: false,
      message: "Refresh token is required",
    });
    return;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);

    const storedTokens = await db.orm.public.RefreshToken.all();

    let validToken = null;

    for (const storedToken of storedTokens) {
      if (storedToken.userId !== payload.userId) {
        continue;
      }

      const matches = await bcrypt.compare(
        refreshToken,
        storedToken.tokenHash,
      );

      if (matches) {
        validToken = storedToken;
        break;
      }
    }

    if (!validToken) {
      res.status(401).json({
        success: false,
        message: "Refresh token has been revoked or is invalid",
      });
      return;
    }

    if (validToken.expiresAt.epochMilliseconds < Date.now()) {
      res.status(401).json({
        success: false,
        message: "Refresh token has expired",
      });
      return;
    }

    const accessToken = createAccessToken({
      userId: payload.userId,
      role: payload.role,
    });

    res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
      accessToken,
    });
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
}