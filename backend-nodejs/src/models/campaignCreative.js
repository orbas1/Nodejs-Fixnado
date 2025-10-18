import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class CampaignCreative extends Model {}

CampaignCreative.init(
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
    name: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    format: {
      type: DataTypes.ENUM('image', 'video', 'html', 'text', 'carousel', 'native'),
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
      field: 'call_to_action',
      type: DataTypes.STRING(64),
      allowNull: true
    },
    assetUrl: {
      field: 'asset_url',
      type: DataTypes.STRING(2048),
      allowNull: false
    },
    thumbnailUrl: {
      field: 'thumbnail_url',
      type: DataTypes.STRING(2048),
      allowNull: true
    },
    reviewStatus: {
      field: 'review_status',
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    },
    rejectionReason: {
      field: 'rejection_reason',
      type: DataTypes.TEXT,
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
    modelName: 'CampaignCreative',
    tableName: 'campaign_creatives',
    underscored: true,
    timestamps: true
  }
);

export default CampaignCreative;
