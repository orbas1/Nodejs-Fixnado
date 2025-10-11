import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class CampaignDailyMetric extends Model {}

CampaignDailyMetric.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    campaignId: {
      field: 'campaign_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    flightId: {
      field: 'flight_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    metricDate: {
      field: 'metric_date',
      type: DataTypes.DATE,
      allowNull: false
    },
    impressions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    clicks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    conversions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    spend: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0
    },
    revenue: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0
    },
    spendTarget: {
      field: 'spend_target',
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true
    },
    ctr: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: true
    },
    cvr: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: true
    },
    anomalyScore: {
      field: 'anomaly_score',
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    exportedAt: {
      field: 'exported_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'CampaignDailyMetric',
    tableName: 'CampaignDailyMetric'
  }
);

export default CampaignDailyMetric;
