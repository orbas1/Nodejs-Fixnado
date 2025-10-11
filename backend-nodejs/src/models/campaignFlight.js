import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class CampaignFlight extends Model {}

CampaignFlight.init(
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
    name: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'scheduled'
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
    budget: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false
    },
    dailySpendCap: {
      field: 'daily_spend_cap',
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'CampaignFlight',
    tableName: 'CampaignFlight'
  }
);

export default CampaignFlight;
