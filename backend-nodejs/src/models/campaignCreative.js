import { Model, DataTypes } from 'sequelize';
import sequelize from '../database/index.js';

class CampaignCreative extends Model {}

CampaignCreative.init(
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
    name: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    format: {
      type: DataTypes.ENUM('image', 'video', 'html', 'text', 'carousel'),
      allowNull: false,
      defaultValue: 'image'
    },
    status: {
      type: DataTypes.ENUM('draft', 'review', 'active', 'paused', 'archived'),
      allowNull: false,
      defaultValue: 'draft'
    },
    headline: {
      type: DataTypes.STRING(180),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    callToAction: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'call_to_action'
    },
    assetUrl: {
      type: DataTypes.STRING(2048),
      allowNull: false,
      field: 'asset_url'
    },
    thumbnailUrl: {
      type: DataTypes.STRING(2048),
      allowNull: true,
      field: 'thumbnail_url'
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
    modelName: 'CampaignCreative',
    tableName: 'CampaignCreative'
  }
);

export default CampaignCreative;
