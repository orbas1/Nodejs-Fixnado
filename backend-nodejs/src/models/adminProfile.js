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
    jobTitle: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: 'job_title'
    },
    department: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    phoneNumber: {
      type: DataTypes.STRING(80),
      allowNull: true,
      field: 'phone_number'
    },
    avatarUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'avatar_url'
    },
    timezone: {
      type: DataTypes.STRING(80),
      allowNull: true
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
    tableName: 'AdminProfile'
  }
);

export default AdminProfile;
