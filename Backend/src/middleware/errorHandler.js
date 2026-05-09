const ApiError = require('../utils/apiError');

module.exports = (error, request, response, next) => {
  const statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';

  if (error.name === 'JsonWebTokenError') {
    message = 'Invalid token';
  }

  if (error.name === 'TokenExpiredError') {
    message = 'Token expired';
  }

  if (error.code === 'P2002') {
    message = 'A record with these details already exists';
  }

  response.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports.ApiError = ApiError;