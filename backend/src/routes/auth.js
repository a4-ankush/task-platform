const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { z } = require("zod");

const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");
const { loadEnv } = require("../config/env");
const { User } = require("../models/User");
const {
  signAccessToken,
  signRefreshToken,
  generateRefreshTokenId,
  createPasswordResetToken,
} = require("../services/tokenService");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function setRefreshCookie(res, token) {
  const env = loadEnv();
  const isProd = env.NODE_ENV === "production";
  res.cookie("refreshToken", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/api/auth",
  });
}

function clearRefreshCookie(res) {
  const env = loadEnv();
  const isProd = env.NODE_ENV === "production";
  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/api/auth",
  });
}

router.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        email: z.string().email(),
        name: z.string().min(1),
        password: z.string().min(8),
      })
      .parse(req.body);

    const existing = await User.findOne({ email: body.email });
    if (existing) throw new ApiError(409, "Email already registered");

    const totalUsers = await User.countDocuments();
    const role = totalUsers === 0 ? "admin" : "user";

    const passwordHash = await User.hashPassword(body.password);
    const user = await User.create({
      email: body.email,
      name: body.name,
      role,
      passwordHash,
    });

    const refreshTokenId = generateRefreshTokenId();
    user.refreshTokenId = refreshTokenId;
    await user.save();

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user, refreshTokenId);
    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
    });
  }),
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        email: z.string().email(),
        password: z.string().min(1),
      })
      .parse(req.body);

    const user = await User.findOne({ email: body.email });
    if (!user) throw new ApiError(401, "Invalid credentials");

    const ok = await user.verifyPassword(body.password);
    if (!ok) throw new ApiError(401, "Invalid credentials");

    const refreshTokenId = generateRefreshTokenId();
    user.refreshTokenId = refreshTokenId;
    await user.save();

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user, refreshTokenId);
    setRefreshCookie(res, refreshToken);

    res.json({
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
    });
  }),
);

router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const env = loadEnv();
    const token = req.cookies.refreshToken;
    if (!token) throw new ApiError(401, "Missing refresh token");

    let payload;
    try {
      payload = jwt.verify(token, env.JWT_REFRESH_SECRET);
    } catch {
      throw new ApiError(401, "Invalid or expired refresh token");
    }

    const user = await User.findById(payload.sub);
    if (!user) throw new ApiError(401, "User not found");

    if (!user.refreshTokenId || user.refreshTokenId !== payload.tid) {
      throw new ApiError(401, "Refresh token has been rotated or revoked");
    }

    const newRefreshTokenId = generateRefreshTokenId();
    user.refreshTokenId = newRefreshTokenId;
    await user.save();

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user, newRefreshTokenId);
    setRefreshCookie(res, refreshToken);

    res.json({ accessToken });
  }),
);

router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const token = req.cookies.refreshToken;
    if (token) {
      try {
        const env = loadEnv();
        const payload = jwt.verify(token, env.JWT_REFRESH_SECRET);
        await User.findByIdAndUpdate(payload.sub, {
          $set: { refreshTokenId: null },
        });
      } catch {
        // ignore
      }
    }

    clearRefreshCookie(res);
    res.json({ ok: true });
  }),
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).lean();
    if (!user) throw new ApiError(404, "User not found");
    res.json({
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  }),
);

router.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const env = loadEnv();
    const body = z.object({ email: z.string().email() }).parse(req.body);

    const user = await User.findOne({ email: body.email });
    // Always return 200 to avoid email enumeration
    if (!user) return res.json({ ok: true });

    const { token, hash } = createPasswordResetToken();
    const expires = new Date(
      Date.now() + env.PASSWORD_RESET_TOKEN_TTL_MIN * 60 * 1000,
    );

    user.passwordResetTokenHash = hash;
    user.passwordResetExpiresAt = expires;
    await user.save();

    // For assignment/demo: return token in dev. In prod, email it.
    const resetUrl = `${env.APP_BASE_URL}/reset-password?token=${token}&email=${encodeURIComponent(
      user.email,
    )}`;

    res.json({ ok: true, resetUrl, token });
  }),
);

router.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        email: z.string().email(),
        token: z.string().min(10),
        newPassword: z.string().min(8),
      })
      .parse(req.body);

    const user = await User.findOne({ email: body.email });
    if (!user) throw new ApiError(400, "Invalid reset token");

    if (!user.passwordResetTokenHash || !user.passwordResetExpiresAt) {
      throw new ApiError(400, "Invalid reset token");
    }

    if (user.passwordResetExpiresAt.getTime() < Date.now()) {
      throw new ApiError(400, "Reset token expired");
    }

    const hash = crypto.createHash("sha256").update(body.token).digest("hex");
    if (hash !== user.passwordResetTokenHash)
      throw new ApiError(400, "Invalid reset token");

    user.passwordHash = await User.hashPassword(body.newPassword);
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    user.refreshTokenId = null; // revoke sessions
    await user.save();

    clearRefreshCookie(res);
    res.json({ ok: true });
  }),
);

module.exports = { router };
