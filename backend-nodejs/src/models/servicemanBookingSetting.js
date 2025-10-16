import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ServicemanBookingSetting extends Model {}

ServicemanBookingSetting.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    servicemanId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'serviceman_id'
    },
    autoAcceptAssignments: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'auto_accept_assignments'
    },
    travelBufferMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
      field: 'travel_buffer_minutes'
    },
    maxDailyJobs: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 8,
      field: 'max_daily_jobs'
    },
    preferredContactChannel: {
      type: DataTypes.STRING(24),
      allowNull: false,
      defaultValue: 'sms',
      field: 'preferred_contact_channel'
    },
    defaultArrivalWindowStart: {
      type: DataTypes.STRING(8),
      allowNull: true,
      field: 'default_arrival_window_start'
    },
    defaultArrivalWindowEnd: {
      type: DataTypes.STRING(8),
      allowNull: true,
      field: 'default_arrival_window_end'
    },
    notesTemplate: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'notes_template'
    },
    safetyBriefTemplate: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'safety_brief_template'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'ServicemanBookingSetting',
    tableName: 'ServicemanBookingSetting',
    underscored: true
  }
);

export default ServicemanBookingSetting;
