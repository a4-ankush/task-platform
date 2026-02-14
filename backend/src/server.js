const http = require("http");
const { Server } = require("socket.io");

const { loadEnv } = require("./config/env");
const { connectDb } = require("./config/db");
const { createApp } = require("./app");
const { registerSocket } = require("./realtime/socket");

async function main() {
  const env = loadEnv();

  // Convenience for local testing: run `set USE_IN_MEMORY_MONGO=true` to avoid installing MongoDB.
  if (process.env.USE_IN_MEMORY_MONGO === "true") {
    // Loaded only when needed (keeps production lightweight)
    // eslint-disable-next-line global-require
    const { MongoMemoryServer } = require("mongodb-memory-server");
    const mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri("task_platform");
    await connectDb(uri);
  } else {
    await connectDb(env.MONGODB_URI);
  }

  const app = createApp();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
    },
  });

  registerSocket(io);
  app.set("io", io);

  server.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on :${env.PORT}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
