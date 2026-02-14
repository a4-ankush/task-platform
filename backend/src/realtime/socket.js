const jwt = require("jsonwebtoken");
const { loadEnv } = require("../config/env");

function registerSocket(io) {
  const env = loadEnv();

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Missing access token"));
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
      socket.user = { id: String(payload.sub), role: payload.role };
      socket.join(`user:${socket.user.id}`);
      next();
    } catch {
      next(new Error("Invalid access token"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("ping", () => socket.emit("pong"));
  });
}

function emitTaskEvent(io, event, task) {
  io.emit(`task:${event}`, task);
  const assigneeId = task?.assignee?._id
    ? String(task.assignee._id)
    : task?.assignee
      ? String(task.assignee)
      : null;
  if (assigneeId) io.to(`user:${assigneeId}`).emit(`task:${event}`, task);
}

module.exports = {
  registerSocket,
  emitTaskEvent,
};
