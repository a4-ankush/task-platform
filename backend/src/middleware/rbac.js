const { ApiError } = require('../utils/apiError');

function requireRole(...allowed) {
  return function rbac(req, _res, next) {
    if (!req.user) return next(new ApiError(401, 'Unauthenticated'));
    if (!allowed.includes(req.user.role)) return next(new ApiError(403, 'Forbidden'));
    return next();
  };
}

module.exports = { requireRole };
