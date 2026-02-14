const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { loadEnv } = require("../config/env");

function signAccessToken(user) {
  const env = loadEnv();
  return jwt.sign(
    { sub: String(user._id), role: user.role, email: user.email },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
  );
}

function signRefreshToken(user, refreshTokenId) {
  const env = loadEnv();
  return jwt.sign(
    { sub: String(user._id), tid: refreshTokenId },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN },
  );
}

function generateRefreshTokenId() {
  // URL-safe, high-entropy token id for refresh rotation
  return crypto.randomBytes(18).toString("base64url");
}

function createPasswordResetToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, hash };
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  generateRefreshTokenId,
  createPasswordResetToken,
};
