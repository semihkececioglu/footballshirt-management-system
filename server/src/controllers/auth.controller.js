import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createError } from '../middleware/error.middleware.js';

export async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (username !== process.env.ADMIN_USERNAME) {
      return next(createError('Geçersiz kullanıcı adı veya şifre', 401));
    }
    const isMatch = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
    if (!isMatch) {
      return next(createError('Geçersiz kullanıcı adı veya şifre', 401));
    }
    const token = jwt.sign({ username }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
    res.json({ success: true, token });
  } catch (err) {
    next(err);
  }
}

export async function hashPassword(req, res, next) {
  try {
    const { password } = req.body;
    if (!password) return next(createError('Şifre gerekli'));
    const hash = await bcrypt.hash(password, 12);
    res.json({ hash });
  } catch (err) {
    next(err);
  }
}
