/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let statusCode = 500;
  let message = 'Erro interno do servidor';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Não autorizado';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Acesso negado';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Recurso não encontrado';
  } else if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Send error response
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err
    })
  });
};

/**
 * 404 handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada'
  });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
