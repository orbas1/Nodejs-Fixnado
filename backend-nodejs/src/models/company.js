import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import {
  decryptString,
  encryptString,
  normaliseEmail,
  stableHash
} from '../utils/security/fieldEncryption.js';

class Company extends Model {
  toJSON() {
    const payload = super.toJSON();
    delete payload.contactEmailHash;
    return payload;
  }
}

Company.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id'
    },
    legalStructure: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'legal_structure'
    },
    contactName: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'contact_name_encrypted',
      set(value) {
        if (value === null || value === undefined || value === '') {
          this.setDataValue('contactName', null);
          return;
        }
        if (typeof value !== 'string') {
          throw new TypeError('contactName must be a string when provided');
        }
        const trimmed = value.trim();
        if (!trimmed) {
          this.setDataValue('contactName', null);
          return;
        }
        this.setDataValue('contactName', encryptString(trimmed, 'company:contactName'));
      },
      get() {
        const stored = this.getDataValue('contactName');
        return stored ? decryptString(stored, 'company:contactName') : null;
      }
    },
    contactEmail: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'contact_email_encrypted',
      set(value) {
        if (value === null || value === undefined || value === '') {
          this.setDataValue('contactEmail', null);
          this.setDataValue('contactEmailHash', null);
          return;
        }
        if (typeof value !== 'string') {
          throw new TypeError('contactEmail must be a string when provided');
        }
        const trimmed = value.trim();
        if (!trimmed) {
          this.setDataValue('contactEmail', null);
          this.setDataValue('contactEmailHash', null);
          return;
        }
        this.setDataValue('contactEmail', encryptString(trimmed, 'company:contactEmail'));
        const normalised = normaliseEmail(trimmed);
        this.setDataValue('contactEmailHash', stableHash(normalised, 'company:contactEmail'));
      },
      get() {
        const stored = this.getDataValue('contactEmail');
        return stored ? decryptString(stored, 'company:contactEmail') : null;
      }
    },
    contactEmailHash: {
      type: DataTypes.STRING(128),
      allowNull: true,
      field: 'contact_email_hash',
      unique: false
    },
    serviceRegions: {
      type: DataTypes.TEXT,
      field: 'service_regions'
    },
    marketplaceIntent: {
      type: DataTypes.TEXT,
      field: 'marketplace_intent'
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    insuredSellerStatus: {
      field: 'insured_seller_status',
      type: DataTypes.ENUM('not_started', 'pending_documents', 'in_review', 'approved', 'suspended'),
      allowNull: false,
      defaultValue: 'not_started'
    },
    insuredSellerExpiresAt: {
      field: 'insured_seller_expires_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    insuredSellerBadgeVisible: {
      field: 'insured_seller_badge_visible',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    complianceScore: {
      field: 'compliance_score',
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    sequelize,
    modelName: 'Company'
  }
);

export default Company;
