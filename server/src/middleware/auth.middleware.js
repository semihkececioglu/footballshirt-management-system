import jwt from 'jsonwebtoken';
import { createError } from './error.middleware.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(createError('Yetkilendirme gerekli', 401));
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(createError('Geçersiz veya süresi dolmuş token', 401));
  }
}
