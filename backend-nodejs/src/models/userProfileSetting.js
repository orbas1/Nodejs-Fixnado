import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import { encryptString, decryptString } from '../utils/security/fieldEncryption.js';

function sanitiseEncrypted(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value !== 'string') {
    throw new TypeError('Encrypted profile fields must be strings when provided.');
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function decryptValue(stored, key) {
  if (!stored) {
    return null;
  }
  try {
    return decryptString(stored, key);
  } catch (error) {
    console.warn('Failed to decrypt user profile field', { key, message: error.message });
    return null;
  }
}

class UserProfileSetting extends Model {
  toJSON() {
    const payload = super.toJSON();
    delete payload.preferredNameEncrypted;
    delete payload.jobTitleEncrypted;
    delete payload.phoneEncrypted;
    return payload;
  }
}

UserProfileSetting.init(
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
    preferredName: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'preferred_name_encrypted',
      set(value) {
        const sanitised = sanitiseEncrypted(value);
        if (sanitised === null) {
          this.setDataValue('preferredName', null);
          return;
        }
        this.setDataValue('preferredName', encryptString(sanitised, 'userProfile:preferredName'));
      },
      get() {
        const stored = this.getDataValue('preferredName');
        return decryptValue(stored, 'userProfile:preferredName');
      }
    },
    jobTitle: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'job_title_encrypted',
      set(value) {
        const sanitised = sanitiseEncrypted(value);
        if (sanitised === null) {
          this.setDataValue('jobTitle', null);
          return;
        }
        this.setDataValue('jobTitle', encryptString(sanitised, 'userProfile:jobTitle'));
      },
      get() {
        const stored = this.getDataValue('jobTitle');
        return decryptValue(stored, 'userProfile:jobTitle');
      }
    },
    phoneNumber: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'phone_encrypted',
      set(value) {
        const sanitised = sanitiseEncrypted(value);
        if (sanitised === null) {
          this.setDataValue('phoneNumber', null);
          return;
        }
        this.setDataValue('phoneNumber', encryptString(sanitised, 'userProfile:phoneNumber'));
      },
      get() {
        const stored = this.getDataValue('phoneNumber');
        return decryptValue(stored, 'userProfile:phoneNumber');
      }
    },
    timezone: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    language: {
      type: DataTypes.STRING(16),
      allowNull: true
    },
    avatarUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'avatar_url'
    },
    notificationPreferences: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      field: 'notification_preferences'
    },
    billingPreferences: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      field: 'billing_preferences'
    },
    invoiceRecipients: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      field: 'invoice_recipients'
    },
    communicationPreferences: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      field: 'communication_preferences'
    },
    quietHoursEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'quiet_hours_enabled'
    },
    quietHoursStart: {
      type: DataTypes.TIME,
      allowNull: true,
      field: 'quiet_hours_start'
    },
    quietHoursEnd: {
      type: DataTypes.TIME,
      allowNull: true,
      field: 'quiet_hours_end'
    },
    quietHoursTimezone: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'quiet_hours_timezone'
    },
    securityMethods: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      field: 'security_methods'
    },
    securityUpdatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'security_updated_at'
    }
  },
  {
    sequelize,
    modelName: 'UserProfileSetting',
    tableName: 'user_profile_settings',
    underscored: true
  }
);

export default UserProfileSetting;
