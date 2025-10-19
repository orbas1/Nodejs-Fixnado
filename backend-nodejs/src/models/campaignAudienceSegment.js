import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

export const CAMPAIGN_AUDIENCE_SEGMENT_STATUSES = Object.freeze([
  'draft',
  'active',
  'paused',
  'archived'
]);

class CampaignAudienceSegment extends Model {}

CampaignAudienceSegment.init(
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
    segmentType: {
      field: 'segment_type',
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: 'custom'
    },
    status: {
      type: DataTypes.ENUM(...CAMPAIGN_AUDIENCE_SEGMENT_STATUSES),
      allowNull: false,
      defaultValue: CAMPAIGN_AUDIENCE_SEGMENT_STATUSES[0]
    },
    sizeEstimate: {
      field: 'size_estimate',
      type: DataTypes.INTEGER,
      allowNull: true
    },
    engagementRate: {
      field: 'engagement_rate',
      type: DataTypes.DECIMAL(9, 6),
      allowNull: true
    },
    syncedAt: {
      field: 'synced_at',
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
    modelName: 'CampaignAudienceSegment',
    tableName: 'CampaignAudienceSegment',
    indexes: [
      {
        fields: ['campaign_id', 'status']
      },
      {
        fields: ['segment_type']
      }
    ],
    hooks: {
      beforeValidate: (instance) => {
        if (instance.metadata == null || typeof instance.metadata !== 'object' || Array.isArray(instance.metadata)) {
          instance.metadata = {};
        } else {
          instance.metadata = { ...instance.metadata };
        }
      }
    },
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default CampaignAudienceSegment;
