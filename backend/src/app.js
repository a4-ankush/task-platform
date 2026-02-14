const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const { loadEnv } = require('./config/env');
const { createRateLimiter } = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./middleware/error');

const { router: healthRouter } = require('./routes/health');
const { router: authRouter } = require('./routes/auth');
const { router: usersRouter } = require('./routes/users');
const { router: tasksRouter } = require('./routes/tasks');

function createApp() {
  const env = loadEnv();
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(createRateLimiter());

  app.use('/api', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/tasks', tasksRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
