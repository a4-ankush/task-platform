const jwt = require("jsonwebtoken");
const { ApiError } = require("../utils/apiError");
const { loadEnv } = require("../config/env");
const { User } = require("../models/User");

async function requireAuth(req, _res, next) {
  const env = loadEnv();
  const header = req.headers.authorization || "";
  const [, token] = header.split(" ");
  if (!token) return next(new ApiError(401, "Missing access token"));

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    const user = await User.findById(payload.sub).lean();
    if (!user) return next(new ApiError(401, "User not found"));
    req.user = {
      id: String(user._id),
      role: user.role,
      email: user.email,
      name: user.name,
    };
    return next();
  } catch {
    return next(new ApiError(401, "Invalid or expired access token"));
  }
}

module.exports = { requireAuth };
