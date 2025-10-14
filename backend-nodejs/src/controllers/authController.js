import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { User, Company } from '../models/index.js';
import config from '../config/index.js';

const SALT_ROUNDS = 10;

export async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password, type, address, age, company } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      firstName,
      lastName,
      email,
      passwordHash,
      address,
      age,
      type
    });

    if (type === 'company' && company) {
      await Company.create({
        userId: user.id,
        legalStructure: company.legalStructure || 'company',
        contactName: company.contactName,
        contactEmail: company.contactEmail || email,
        serviceRegions: company.serviceRegions,
        marketplaceIntent: company.marketplaceIntent
      });
    }

    return res.status(201).json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      type: user.type
    });
  } catch (error) {
    next(error);
  }
}

function secureCompare(expected, received) {
  if (typeof expected !== 'string' || typeof received !== 'string') {
    return false;
  }

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

function isEmailAllowed(email, allowedEmails = [], allowedDomains = []) {
  if (allowedEmails.length === 0 && allowedDomains.length === 0) {
    return true;
  }

  if (allowedEmails.includes(email)) {
    return true;
  }

  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) {
    return false;
  }

  return allowedDomains.includes(domain);
}

export async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { email, password, securityToken } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.type === 'admin') {
      const { securityToken: expectedToken, allowedEmails, allowedDomains, sessionTtlHours } = config.auth.admin;
      if (!expectedToken || !securityToken || !secureCompare(expectedToken, securityToken)) {
        return res.status(401).json({ message: 'Admin security token required' });
      }

      if (!isEmailAllowed(user.email, allowedEmails, allowedDomains)) {
        return res.status(403).json({ message: 'Admin access restricted' });
      }

      const expiresIn = `${sessionTtlHours}h`;
      const token = jwt.sign({ sub: user.id, type: user.type }, config.jwt.secret, { expiresIn });
      return res.json({ token, user: { id: user.id, email: user.email, type: user.type }, expiresIn });
    }

    const token = jwt.sign({ sub: user.id, type: user.type }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    return res.json({ token, user: { id: user.id, email: user.email, type: user.type }, expiresIn: config.jwt.expiresIn });
  } catch (error) {
    next(error);
  }
}

export async function profile(req, res, next) {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Company }]
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(user);
  } catch (error) {
    next(error);
  }
}
