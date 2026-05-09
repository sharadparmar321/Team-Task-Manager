const ApiError = require('../utils/apiError');

module.exports = (...allowedRoles) => (request, response, next) => {
  if (!request.user) {
    return next(new ApiError(401, 'Authentication required'));
  }

  if (!allowedRoles.includes(request.user.role)) {
    return next(new ApiError(403, 'You do not have permission to perform this action'));
  }

  next();
};