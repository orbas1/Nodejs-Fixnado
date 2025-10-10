export function notFound(req, res) {
  res.status(404).json({ message: 'Route not found' });
}

export function errorHandler(err, req, res, _next) {
  const status = typeof err.status === 'number' ? err.status : 500;
  console.error('Unhandled request error', {
    path: req.path,
    method: req.method,
    traceId: req.headers['x-request-id'],
    status,
    error: err.stack
  });

  const responseBody = {
    message:
      status >= 500
        ? 'Internal server error'
        : err.message ?? 'Request could not be processed'
  };

  if (err.errors && Array.isArray(err.errors)) {
    responseBody.errors = err.errors;
  }

  res.status(status).json(responseBody);
}
