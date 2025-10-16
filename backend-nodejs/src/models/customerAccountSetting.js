import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class CustomerAccountSetting extends Model {}

CustomerAccountSetting.init(
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
      type: DataTypes.STRING(120),
      allowNull: false,
      defaultValue: 'Europe/London'
    },
    locale: {
      type: DataTypes.STRING(24),
      allowNull: false,
      defaultValue: 'en-GB'
    },
    defaultCurrency: {
      type: DataTypes.STRING(12),
      allowNull: false,
      defaultValue: 'GBP',
      field: 'default_currency'
    },
    weeklySummaryEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'weekly_summary_enabled'
    },
    dispatchAlertsEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'dispatch_alerts_enabled'
    },
    escrowAlertsEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'escrow_alerts_enabled'
    },
    conciergeAlertsEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'concierge_alerts_enabled'
    },
    quietHoursStart: {
      type: DataTypes.STRING(8),
      allowNull: true,
      field: 'quiet_hours_start'
    },
    quietHoursEnd: {
      type: DataTypes.STRING(8),
      allowNull: true,
      field: 'quiet_hours_end'
    }
  },
  {
    sequelize,
    modelName: 'CustomerAccountSetting'
  }
);

export default CustomerAccountSetting;
