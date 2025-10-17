import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class AdminProfile extends Model {}

AdminProfile.init(
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
    displayName: {
      type: DataTypes.STRING(160),
      allowNull: true,
      field: 'display_name'
    },
    jobTitle: {
      type: DataTypes.STRING(160),
      allowNull: true,
      field: 'job_title'
    },
    department: {
      type: DataTypes.STRING(160),
      allowNull: true
    },
    pronouns: {
      type: DataTypes.STRING(80),
      allowNull: true
    },
    phoneNumber: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'phone_number'
    },
    avatarUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'avatar_url'
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    contactEmail: {
      type: DataTypes.STRING(254),
      allowNull: true,
      field: 'contact_email'
    },
    backupEmail: {
      type: DataTypes.STRING(254),
      allowNull: true,
      field: 'backup_email'
    },
    contactPhone: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'contact_phone'
    },
    location: {
      type: DataTypes.STRING(160),
      allowNull: true
    },
    timezone: {
      type: DataTypes.STRING(80),
      allowNull: true
    },
    language: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    theme: {
      type: DataTypes.STRING(32),
      allowNull: true
    },
    workingHours: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      field: 'working_hours'
    },
    addressLine1: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'address_line1'
    },
    addressLine2: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'address_line2'
    },
    city: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    state: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    postalCode: {
      type: DataTypes.STRING(40),
      allowNull: true,
      field: 'postal_code'
    },
    country: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    notificationPreferences: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      field: 'notification_preferences'
    },
    securityPreferences: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      field: 'security_preferences'
    },
    delegates: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    escalationContacts: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      field: 'escalation_contacts'
    },
    outOfOffice: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      field: 'out_of_office'
    },
    resourceLinks: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      field: 'resource_links'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    notificationEmails: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      field: 'notification_emails'
    }
  },
  {
    sequelize,
    modelName: 'AdminProfile',
    tableName: 'admin_profiles',
    underscored: true
  }
);

export default AdminProfile;
