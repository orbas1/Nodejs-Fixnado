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
    name: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('draft', 'in_review', 'active', 'paused', 'retired'),
      allowNull: false,
      defaultValue: 'draft'
    },
    format: {
      type: DataTypes.ENUM('image', 'video', 'carousel', 'html', 'native'),
      allowNull: false,
      defaultValue: 'image'
    },
    headline: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    callToAction: {
      field: 'call_to_action',
      type: DataTypes.STRING(60),
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
    tableName: 'CampaignCreative'
  }
);

export default CampaignCreative;
