import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class AdCampaign extends Model {}

AdCampaign.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    companyId: {
      field: 'company_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    objective: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    campaignType: {
      field: 'campaign_type',
      type: DataTypes.ENUM('ppc', 'ppc_conversion', 'ppi', 'awareness'),
      allowNull: false,
      defaultValue: 'ppc'
    },
    status: {
      type: DataTypes.ENUM('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'draft'
    },
    pacingStrategy: {
      field: 'pacing_strategy',
      type: DataTypes.ENUM('even', 'asap', 'lifetime'),
      allowNull: false,
      defaultValue: 'even'
    },
    bidStrategy: {
      field: 'bid_strategy',
      type: DataTypes.ENUM('cpc', 'cpm', 'cpa'),
      allowNull: false,
      defaultValue: 'cpc'
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'GBP'
    },
    totalBudget: {
      field: 'total_budget',
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false
    },
    dailySpendCap: {
      field: 'daily_spend_cap',
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true
    },
    startAt: {
      field: 'start_at',
      type: DataTypes.DATE,
      allowNull: false
    },
    endAt: {
      field: 'end_at',
      type: DataTypes.DATE,
      allowNull: false
    },
    timezone: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: 'Europe/London'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'AdCampaign',
    tableName: 'AdCampaign',
    underscored: false
  }
);

export default AdCampaign;
