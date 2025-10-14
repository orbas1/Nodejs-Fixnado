import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { User } from '../models/index.js';

export async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ message: 'Missing authorization header' });
  }

  const token = header.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    const user = await User.findByPk(payload.sub);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = { id: user.id, type: user.type };
    next();
  } catch (error) {
    console.warn('JWT validation failed', { message: error.message });
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export function authorize(types = []) {
  return (req, res, next) => {
    if (types.length && !types.includes(req.user?.type)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

const STORE_FRONT_ALLOWED = new Set(['company', 'provider']);

export function requireStorefrontRole(req, res, next) {
  const headerRole = `${req.headers['x-fixnado-role'] ?? ''}`.toLowerCase();
  const userRole = `${req.user?.type ?? ''}`.toLowerCase();

  if (STORE_FRONT_ALLOWED.has(userRole)) {
    return next();
  }

  if (STORE_FRONT_ALLOWED.has(headerRole)) {
    return next();
  }

  return res.status(req.user ? 403 : 401).json({ message: 'Storefront access restricted to providers' });
}
