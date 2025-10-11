import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class CampaignAnalyticsExport extends Model {}

CampaignAnalyticsExport.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    campaignDailyMetricId: {
      field: 'campaign_daily_metric_id',
      type: DataTypes.UUID,
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'failed'),
      allowNull: false,
      defaultValue: 'pending'
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    lastError: {
      field: 'last_error',
      type: DataTypes.TEXT,
      allowNull: true
    },
    lastAttemptAt: {
      field: 'last_attempt_at',
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'CampaignAnalyticsExport',
    tableName: 'CampaignAnalyticsExport'
  }
);

export default CampaignAnalyticsExport;
