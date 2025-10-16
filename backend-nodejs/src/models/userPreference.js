import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import { decryptString, encryptString } from '../utils/security/fieldEncryption.js';

function sanitiseString(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new TypeError('Preference string fields must be strings when provided');
  }

  const trimmed = value.trim();
  return trimmed || null;
}

class UserPreference extends Model {
  toJSON() {
    const payload = super.toJSON();
    return {
      ...payload,
      workspaceShortcuts: Array.isArray(payload.workspaceShortcuts) ? payload.workspaceShortcuts : [],
      roleAssignments: Array.isArray(payload.roleAssignments) ? payload.roleAssignments : [],
      notificationChannels: Array.isArray(payload.notificationChannels) ? payload.notificationChannels : []
    };
  }
}

const JSON_TYPE = sequelize.getDialect() === 'postgres' ? DataTypes.JSONB : DataTypes.JSON;

UserPreference.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'user_id'
    },
    timezone: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: 'UTC'
    },
    locale: {
      type: DataTypes.STRING(16),
      allowNull: false,
      defaultValue: 'en-GB'
    },
    organisation: {
      type: DataTypes.STRING(160),
      allowNull: true,
      field: 'organisation_name',
      set(value) {
        this.setDataValue('organisation', sanitiseString(value));
      }
    },
    jobTitle: {
      type: DataTypes.STRING(160),
      allowNull: true,
      field: 'job_title',
      set(value) {
        this.setDataValue('jobTitle', sanitiseString(value));
      }
    },
    teamName: {
      type: DataTypes.STRING(160),
      allowNull: true,
      field: 'team_name',
      set(value) {
        this.setDataValue('teamName', sanitiseString(value));
      }
    },
    avatarUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'avatar_url',
      set(value) {
        this.setDataValue('avatarUrl', sanitiseString(value));
      }
    },
    signature: {
      type: DataTypes.TEXT,
      allowNull: true,
      set(value) {
        this.setDataValue('signature', sanitiseString(value));
      }
    },
    digestFrequency: {
      type: DataTypes.ENUM('never', 'daily', 'weekly'),
      allowNull: false,
      defaultValue: 'weekly',
      field: 'digest_frequency'
    },
    emailAlerts: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'email_alerts'
    },
    smsAlerts: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'sms_alerts'
    },
    pushAlerts: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'push_alerts'
    },
    marketingOptIn: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'marketing_opt_in'
    },
    primaryPhone: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'primary_phone_encrypted',
      set(value) {
        if (value === null || value === undefined || value === '') {
          this.setDataValue('primaryPhone', null);
          return;
        }
        if (typeof value !== 'string') {
          throw new TypeError('primaryPhone must be a string when provided');
        }
        const trimmed = value.trim();
        if (!trimmed) {
          this.setDataValue('primaryPhone', null);
          return;
        }
        this.setDataValue('primaryPhone', encryptString(trimmed, 'user:primaryPhone'));
      },
      get() {
        const stored = this.getDataValue('primaryPhone');
        return stored ? decryptString(stored, 'user:primaryPhone') : null;
      }
    },
    workspaceShortcuts: {
      type: JSON_TYPE,
      allowNull: false,
      defaultValue: [],
      field: 'workspace_shortcuts'
    },
    roleAssignments: {
      type: JSON_TYPE,
      allowNull: false,
      defaultValue: [],
      field: 'role_assignments'
    },
    notificationChannels: {
      type: JSON_TYPE,
      allowNull: false,
      defaultValue: [],
      field: 'notification_channels'
    }
  },
  {
    sequelize,
    tableName: 'user_preferences',
    modelName: 'UserPreference'
  }
);

export default UserPreference;
