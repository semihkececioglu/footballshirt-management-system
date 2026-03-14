export function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  const message = err.message || 'Sunucu hatası';
  res.status(status).json({ success: false, message });
}

export function createError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}
