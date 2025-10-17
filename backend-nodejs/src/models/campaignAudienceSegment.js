import { Model, DataTypes } from 'sequelize';
import sequelize from '../database/index.js';

class CampaignAudienceSegment extends Model {}

CampaignAudienceSegment.init(
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
    name: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    segmentType: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: 'custom',
      field: 'segment_type'
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'paused', 'archived'),
      allowNull: false,
      defaultValue: 'draft'
    },
    sizeEstimate: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'size_estimate'
    },
    engagementRate: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: true,
      field: 'engagement_rate'
    },
    syncedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'synced_at'
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
    modelName: 'CampaignAudienceSegment',
    tableName: 'CampaignAudienceSegment'
  }
);

export default CampaignAudienceSegment;
