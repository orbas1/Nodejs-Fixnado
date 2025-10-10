import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { UniqueConstraintError } from 'sequelize';
import { User, Company, sequelize } from '../models/index.js';
import config from '../config/index.js';

const SALT_ROUNDS = 10;

const USER_PUBLIC_ATTRIBUTES = [
  'id',
  'firstName',
  'lastName',
  'email',
  'type',
  'address',
  'age',
  'twoFactorEmail',
  'twoFactorApp',
  'createdAt',
  'updatedAt'
];

const COMPANY_PUBLIC_ATTRIBUTES = [
  'id',
  'legalStructure',
  'contactName',
  'contactEmail',
  'serviceRegions',
  'marketplaceIntent',
  'verified',
  'createdAt',
  'updatedAt'
];

function formatValidationErrors(errors) {
  return errors.array().map(({ param, msg, location }) => ({
    field: param,
    location,
    message: msg
  }));
}

function sanitizeUserPayload(userInstance) {
  if (!userInstance) {
    return null;
  }

  const plain =
    typeof userInstance.get === 'function'
      ? userInstance.get({ plain: true })
      : userInstance;

  const company = plain.Company || plain.company || null;

  return {
    id: plain.id,
    firstName: plain.firstName,
    lastName: plain.lastName,
    email: plain.email,
    type: plain.type,
    address: plain.address,
    age: plain.age,
    twoFactor: {
      email: Boolean(plain.twoFactorEmail),
      app: Boolean(plain.twoFactorApp)
    },
    company: company
      ? {
          id: company.id,
          legalStructure: company.legalStructure,
          contactName: company.contactName,
          contactEmail: company.contactEmail,
          serviceRegions: company.serviceRegions,
          marketplaceIntent: company.marketplaceIntent,
          verified: Boolean(company.verified),
          createdAt: company.createdAt,
          updatedAt: company.updatedAt
        }
      : null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt
  };
}

async function reloadUserForResponse(user, transaction) {
  await user.reload({
    attributes: USER_PUBLIC_ATTRIBUTES,
    include: [
      {
        model: Company,
        attributes: COMPANY_PUBLIC_ATTRIBUTES,
        required: false
      }
    ],
    transaction
  });
  return sanitizeUserPayload(user);
}

export async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        message: 'Registration validation failed',
        errors: formatValidationErrors(errors)
      });
    }

    const {
      firstName,
      lastName,
      email,
      password,
      type,
      address,
      age,
      company
    } = req.body;

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedAge =
      typeof age === 'number' ? age : age ? parseInt(age, 10) || null : null;

    const existing = await User.findOne({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const userResponse = await sequelize.transaction(async (transaction) => {
      const user = await User.create(
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: normalizedEmail,
          passwordHash,
          address: address?.trim?.() || address || null,
          age: normalizedAge,
          type
        },
        { transaction }
      );

      if (type === 'company') {
        const normalizedCompany = {
          userId: user.id,
          legalStructure: String(company.legalStructure).trim(),
          contactName: String(company.contactName).trim(),
          contactEmail:
            company.contactEmail
              ? String(company.contactEmail).trim().toLowerCase()
              : normalizedEmail,
          serviceRegions: Array.isArray(company.serviceRegions)
            ? company.serviceRegions.filter(Boolean).join(',')
            : company.serviceRegions
              ? String(company.serviceRegions).trim()
              : null,
          marketplaceIntent: company.marketplaceIntent || null
        };

        await Company.create(normalizedCompany, { transaction });
      }

      return reloadUserForResponse(user, transaction);
    });

    return res.status(201).json({
      message: 'Registration successful',
      user: userResponse
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        message: 'Login validation failed',
        errors: formatValidationErrors(errors)
      });
    }

    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const safeUser = await reloadUserForResponse(user);

    const tokenPayload = { sub: safeUser.id, type: safeUser.type };
    const token = jwt.sign(tokenPayload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });

    return res.json({
      token,
      tokenType: 'Bearer',
      expiresIn: config.jwt.expiresIn,
      user: safeUser
    });
  } catch (error) {
    next(error);
  }
}

export async function profile(req, res, next) {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: USER_PUBLIC_ATTRIBUTES,
      include: [
        {
          model: Company,
          attributes: COMPANY_PUBLIC_ATTRIBUTES,
          required: false
        }
      ]
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ user: sanitizeUserPayload(user) });
  } catch (error) {
    next(error);
  }
}
