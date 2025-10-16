import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ProviderCalendarSetting extends Model {}

ProviderCalendarSetting.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'company_id'
    },
    timezone: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: 'Europe/London'
    },
    weekStartsOn: {
      type: DataTypes.ENUM('monday', 'sunday'),
      allowNull: false,
      defaultValue: 'monday',
      field: 'week_starts_on'
    },
    defaultView: {
      type: DataTypes.ENUM('month', 'week', 'day'),
      allowNull: false,
      defaultValue: 'month',
      field: 'default_view'
    },
    workdayStart: {
      type: DataTypes.STRING(8),
      allowNull: false,
      defaultValue: '08:00',
      field: 'workday_start'
    },
    workdayEnd: {
      type: DataTypes.STRING(8),
      allowNull: false,
      defaultValue: '18:00',
      field: 'workday_end'
    },
    allowOverlapping: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'allow_overlapping'
    },
    autoAcceptAssignments: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'auto_accept_assignments'
    },
    notificationRecipients: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      field: 'notification_recipients'
    }
  },
  {
    sequelize,
    modelName: 'ProviderCalendarSetting',
    tableName: 'provider_calendar_settings',
    underscored: true
  }
);

export default ProviderCalendarSetting;
