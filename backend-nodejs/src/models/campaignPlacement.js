import { Model, DataTypes } from 'sequelize';
import sequelize from '../database/index.js';

class CampaignPlacement extends Model {}

CampaignPlacement.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    campaignId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'campaign_id'
    },
    flightId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'flight_id'
    },
    channel: {
      type: DataTypes.ENUM('marketplace', 'email', 'push', 'sms', 'display', 'social'),
      allowNull: false,
      defaultValue: 'marketplace'
    },
    format: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: 'native'
    },
    status: {
      type: DataTypes.ENUM('planned', 'active', 'paused', 'completed'),
      allowNull: false,
      defaultValue: 'planned'
    },
    bidAmount: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
      field: 'bid_amount'
    },
    bidCurrency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'GBP',
      field: 'bid_currency'
    },
    cpm: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true
    },
    inventorySource: {
      type: DataTypes.STRING(160),
      allowNull: true,
      field: 'inventory_source'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at'
    }
  },
  {
    sequelize,
    modelName: 'CampaignPlacement',
    tableName: 'CampaignPlacement'
  }
);

export default CampaignPlacement;
