import { DataTypes, Model, Op } from 'sequelize';
import isEmail from 'validator/lib/isEmail.js';
import sequelize from '../config/database.js';
import {
  decryptString,
  encryptString,
  normaliseEmail,
  protectEmail,
  stableHash
} from '../utils/security/fieldEncryption.js';

function transformEmailConditions(whereClause) {
  if (!whereClause || typeof whereClause !== 'object') {
    return;
  }

  for (const key of Reflect.ownKeys(whereClause)) {
    if (key === 'email') {
      const condition = whereClause[key];
      const replacement = buildEmailHashCondition(condition);
      delete whereClause.email;
      Object.assign(whereClause, replacement);
      continue;
    }

    if (key === Op.and || key === Op.or) {
      const clauses = whereClause[key];
      if (Array.isArray(clauses)) {
        clauses.forEach((clause) => transformEmailConditions(clause));
      }
      continue;
    }

    const value = whereClause[key];
    if (typeof value === 'object') {
      transformEmailConditions(value);
    }
  }
}

function buildEmailHashCondition(condition) {
  if (typeof condition === 'string') {
    return { emailHash: stableHash(normaliseEmail(condition), 'user:email-query') };
  }

  if (condition && typeof condition === 'object') {
    if (Object.hasOwn(condition, Op.eq)) {
      return { emailHash: stableHash(normaliseEmail(condition[Op.eq]), 'user:email-query') };
    }

    if (Object.hasOwn(condition, Op.in)) {
      const values = condition[Op.in];
      if (!Array.isArray(values) || values.length === 0) {
        throw new Error('Email IN queries must include at least one value.');
      }

      return {
        emailHash: {
          [Op.in]: values.map((value) => stableHash(normaliseEmail(value), 'user:email-query'))
        }
      };
    }
  }

  throw new Error('Only direct equality email lookups are supported once PII hashing is enabled.');
}

class User extends Model {
  toJSON() {
    const payload = super.toJSON();
    delete payload.emailHash;
    return payload;
  }

  toSafeJSON() {
    const payload = this.toJSON();
    delete payload.passwordHash;
    return payload;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    firstName: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'first_name_encrypted',
      set(value) {
        if (typeof value !== 'string') {
          throw new TypeError('firstName must be a string');
        }
        const trimmed = value.trim();
        if (!trimmed) {
          throw new Error('firstName cannot be empty');
        }
        this.setDataValue('firstName', encryptString(trimmed, 'user:firstName'));
      },
      get() {
        const stored = this.getDataValue('firstName');
        return stored ? decryptString(stored, 'user:firstName') : null;
      }
    },
    lastName: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'last_name_encrypted',
      set(value) {
        if (typeof value !== 'string') {
          throw new TypeError('lastName must be a string');
        }
        const trimmed = value.trim();
        if (!trimmed) {
          throw new Error('lastName cannot be empty');
        }
        this.setDataValue('lastName', encryptString(trimmed, 'user:lastName'));
      },
      get() {
        const stored = this.getDataValue('lastName');
        return stored ? decryptString(stored, 'user:lastName') : null;
      }
    },
    email: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'email_encrypted',
      unique: false,
      validate: {
        isEncryptedEmail(value) {
          if (typeof value !== 'string' || value.trim() === '') {
            throw new Error('Encrypted email payload must be present.');
          }
        }
      },
      set(value) {
        if (typeof value !== 'string') {
          throw new TypeError('email must be a string');
        }
        const trimmed = value.trim();
        if (!trimmed) {
          throw new Error('email cannot be empty');
        }

        if (!isEmail(trimmed)) {
          throw new Error('email must be a valid email address');
        }

        const { encrypted, hash } = protectEmail(trimmed);
        this.setDataValue('email', encrypted);
        this.setDataValue('emailHash', hash);
      },
      get() {
        const stored = this.getDataValue('email');
        return stored ? decryptString(stored, 'user:email') : null;
      }
    },
    emailHash: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
      field: 'email_hash'
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'password_hash'
    },
    address: {
      type: DataTypes.TEXT,
      field: 'address_encrypted',
      allowNull: true,
      set(value) {
        if (value === null || value === undefined || value === '') {
          this.setDataValue('address', null);
          return;
        }
        if (typeof value !== 'string') {
          throw new TypeError('address must be a string when provided');
        }
        const trimmed = value.trim();
        if (!trimmed) {
          this.setDataValue('address', null);
          return;
        }
        this.setDataValue('address', encryptString(trimmed, 'user:address'));
      },
      get() {
        const stored = this.getDataValue('address');
        return stored ? decryptString(stored, 'user:address') : null;
      }
    },
    age: DataTypes.INTEGER,
    type: {
      type: DataTypes.ENUM(
        'user',
        'company',
        'servicemen',
        'admin',
        'provider_admin',
        'operations_admin'
      ),
      allowNull: false,
      defaultValue: 'user'
    },
    twoFactorEmail: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'two_factor_email'
    },
    twoFactorApp: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'two_factor_app'
    },
    regionId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'region_id'
    }
  },
  {
    sequelize,
    modelName: 'User',
    defaultScope: {
      attributes: { exclude: ['emailHash'] }
    }
  }
);

User.addHook('beforeFind', (options) => {
  if (!options || !options.where) {
    return;
  }
  transformEmailConditions(options.where);
});

export default User;
