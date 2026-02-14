const rateLimit = require("express-rate-limit");
const { loadEnv } = require("../config/env");

function createRateLimiter() {
  const env = loadEnv();
  return rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: { message: "Too many requests, please try again later." },
    },
  });
}

module.exports = { createRateLimiter };
