import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

export const CAMPAIGN_PLACEMENT_CHANNELS = Object.freeze([
  'marketplace',
  'email',
  'push',
  'sms',
  'display',
  'social'
]);

export const CAMPAIGN_PLACEMENT_STATUSES = Object.freeze([
  'planned',
  'active',
  'paused',
  'completed'
]);

class CampaignPlacement extends Model {}

CampaignPlacement.init(
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
    channel: {
      type: DataTypes.ENUM(...CAMPAIGN_PLACEMENT_CHANNELS),
      allowNull: false,
      defaultValue: CAMPAIGN_PLACEMENT_CHANNELS[0]
    },
    format: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: 'native'
    },
    status: {
      type: DataTypes.ENUM(...CAMPAIGN_PLACEMENT_STATUSES),
      allowNull: false,
      defaultValue: CAMPAIGN_PLACEMENT_STATUSES[0]
    },
    bidAmount: {
      field: 'bid_amount',
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true
    },
    bidCurrency: {
      field: 'bid_currency',
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'GBP',
      validate: {
        len: [3, 3]
      }
    },
    cpm: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true
    },
    inventorySource: {
      field: 'inventory_source',
      type: DataTypes.STRING(160),
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
    modelName: 'CampaignPlacement',
    tableName: 'CampaignPlacement',
    indexes: [
      {
        fields: ['campaign_id', 'status']
      },
      {
        fields: ['flight_id']
      },
      {
        fields: ['channel']
      }
    ],
    hooks: {
      beforeValidate: (instance) => {
        if (instance.metadata == null || typeof instance.metadata !== 'object' || Array.isArray(instance.metadata)) {
          instance.metadata = {};
        } else {
          instance.metadata = { ...instance.metadata };
        }
        if (instance.bidCurrency) {
          instance.bidCurrency = instance.bidCurrency.toUpperCase();
        }
      }
    },
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default CampaignPlacement;
