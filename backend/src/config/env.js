const { z } = require("zod");

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  MONGODB_URI: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().default(120),

  PASSWORD_RESET_TOKEN_TTL_MIN: z.coerce.number().default(30),
  APP_BASE_URL: z.string().default("http://localhost:3000"),
});

function loadEnv() {
  if (!process.env.__ENV_LOADED) {
    // Lazy-load dotenv so tests can inject env first
    require("dotenv").config();
    process.env.__ENV_LOADED = "1";
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${message}`);
  }
  return parsed.data;
}

module.exports = {
  loadEnv,
};
