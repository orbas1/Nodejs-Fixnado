import { Model, DataTypes } from 'sequelize';
import sequelize from '../database/index.js';
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
      type: DataTypes.UUID,
      allowNull: false,
      field: 'campaign_id'
    },
    flightId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'flight_id'
      field: 'campaign_id',
      type: DataTypes.UUID,
      allowNull: false
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
