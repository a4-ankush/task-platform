const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongo;

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.CORS_ORIGIN = "http://localhost:3000";
  process.env.JWT_ACCESS_SECRET = "test-access-secret-1234567890";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret-1234567890";
  process.env.JWT_ACCESS_EXPIRES_IN = "15m";
  process.env.JWT_REFRESH_EXPIRES_IN = "7d";
  process.env.RATE_LIMIT_WINDOW_MS = "60000";
  process.env.RATE_LIMIT_MAX = "10000";
  process.env.PASSWORD_RESET_TOKEN_TTL_MIN = "30";
  process.env.APP_BASE_URL = "http://localhost:3000";

  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri("task_platform_test");

  await mongoose.connect(process.env.MONGODB_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (const c of collections) {
    await c.deleteMany({});
  }
});
