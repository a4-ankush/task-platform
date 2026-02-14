const { ApiError } = require('../utils/apiError');

function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, _req, res, _next) {
  const status = err.statusCode || 500;
  const payload = {
    error: {
      message: err.message || 'Internal Server Error',
    },
  };

  if (err.details) payload.error.details = err.details;
  if (process.env.NODE_ENV !== 'production') {
    payload.error.stack = err.stack;
  }

  res.status(status).json(payload);
}

module.exports = {
  notFound,
  errorHandler,
};
