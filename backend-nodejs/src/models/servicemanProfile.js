import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import { decryptString, encryptString } from '../utils/security/fieldEncryption.js';

function normaliseOptionalString(value) {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new TypeError('Value must be a string when provided');
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

class ServicemanProfile extends Model {
  toJSON() {
    const payload = super.toJSON();
    delete payload.contactEmailEncrypted;
    delete payload.contactPhoneEncrypted;
    delete payload.notesEncrypted;
    return payload;
  }
}

ServicemanProfile.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'company_id'
    },
    displayName: {
      type: DataTypes.STRING(160),
      allowNull: false,
      field: 'display_name',
      validate: {
        notEmpty: true
      }
    },
    role: {
      type: DataTypes.STRING(160),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'standby', 'on_leave', 'training'),
      allowNull: false,
      defaultValue: 'active'
    },
    employmentType: {
      type: DataTypes.ENUM('full_time', 'part_time', 'contractor'),
      allowNull: false,
      defaultValue: 'full_time',
      field: 'employment_type'
    },
    primaryZone: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: 'primary_zone'
    },
    contactEmailEncrypted: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'contact_email_encrypted'
    },
    contactPhoneEncrypted: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'contact_phone_encrypted'
    },
    avatarUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'avatar_url'
    },
    skills: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    notesEncrypted: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'notes_encrypted'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at'
    }
  },
  {
    sequelize,
    tableName: 'ServicemanProfile',
    underscored: true,
    hooks: {
      beforeValidate(profile) {
        if (!Array.isArray(profile.skills)) {
          profile.skills = [];
        }
      }
    },
    getterMethods: {
      contactEmail() {
        const stored = this.getDataValue('contactEmailEncrypted');
        return stored ? decryptString(stored, 'servicemanProfile:contactEmail') : null;
      },
      contactPhone() {
        const stored = this.getDataValue('contactPhoneEncrypted');
        return stored ? decryptString(stored, 'servicemanProfile:contactPhone') : null;
      },
      notes() {
        const stored = this.getDataValue('notesEncrypted');
        return stored ? decryptString(stored, 'servicemanProfile:notes') : null;
      }
    },
    setterMethods: {
      contactEmail(value) {
        const normalised = normaliseOptionalString(value);
        if (!normalised) {
          this.setDataValue('contactEmailEncrypted', null);
          return;
        }
        this.setDataValue('contactEmailEncrypted', encryptString(normalised, 'servicemanProfile:contactEmail'));
      },
      contactPhone(value) {
        const normalised = normaliseOptionalString(value);
        if (!normalised) {
          this.setDataValue('contactPhoneEncrypted', null);
          return;
        }
        this.setDataValue('contactPhoneEncrypted', encryptString(normalised, 'servicemanProfile:contactPhone'));
      },
      notes(value) {
        const normalised = normaliseOptionalString(value);
        if (!normalised) {
          this.setDataValue('notesEncrypted', null);
          return;
        }
        this.setDataValue('notesEncrypted', encryptString(normalised, 'servicemanProfile:notes'));
      }
    }
  }
);

export default ServicemanProfile;
