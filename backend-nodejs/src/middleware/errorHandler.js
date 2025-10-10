export function notFound(req, res, next) {
  res.status(404).json({ message: 'Route not found' });
}

export function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
}
