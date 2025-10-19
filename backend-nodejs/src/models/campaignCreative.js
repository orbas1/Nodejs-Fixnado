import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

export const CAMPAIGN_CREATIVE_STATUSES = Object.freeze([
  'draft',
  'in_review',
  'active',
  'paused',
  'retired'
]);

export const CAMPAIGN_CREATIVE_FORMATS = Object.freeze([
  'image',
  'video',
  'carousel',
  'html',
  'native'
]);

export const CAMPAIGN_CREATIVE_REVIEW_STATUSES = Object.freeze([
  'pending',
  'approved',
  'rejected'
]);

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
    status: {
      type: DataTypes.ENUM(...CAMPAIGN_CREATIVE_STATUSES),
      allowNull: false,
      defaultValue: CAMPAIGN_CREATIVE_STATUSES[0]
    },
    format: {
      type: DataTypes.ENUM(...CAMPAIGN_CREATIVE_FORMATS),
      allowNull: false,
      defaultValue: CAMPAIGN_CREATIVE_FORMATS[0]
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
      allowNull: false,
      validate: {
        isUrl: true
      }
    },
    thumbnailUrl: {
      field: 'thumbnail_url',
      type: DataTypes.STRING(2048),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    reviewStatus: {
      field: 'review_status',
      type: DataTypes.ENUM(...CAMPAIGN_CREATIVE_REVIEW_STATUSES),
      allowNull: false,
      defaultValue: CAMPAIGN_CREATIVE_REVIEW_STATUSES[0]
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
    tableName: 'CampaignCreative',
    indexes: [
      {
        fields: ['campaign_id']
      },
      {
        fields: ['campaign_id', 'status']
      },
      {
        fields: ['flight_id']
      }
    ],
    hooks: {
      beforeValidate: (instance) => {
        if (instance.metadata == null || typeof instance.metadata !== 'object' || Array.isArray(instance.metadata)) {
          instance.metadata = {};
        } else {
          instance.metadata = { ...instance.metadata };
        }

        if (instance.callToAction) {
          instance.callToAction = instance.callToAction.trim();
        }

        if (instance.assetUrl) {
          instance.assetUrl = instance.assetUrl.trim();
        }
        if (instance.thumbnailUrl) {
          const trimmedThumbnail = instance.thumbnailUrl.trim();
          instance.thumbnailUrl = trimmedThumbnail.length ? trimmedThumbnail : null;
        }
      }
    },
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export function ensureCampaignCreativeAssociations({
  AdCampaign,
  CampaignFlight
}) {
  if (!CampaignCreative.associations?.campaign) {
    CampaignCreative.belongsTo(AdCampaign, { foreignKey: 'campaignId', as: 'campaign' });
  }
  if (!CampaignCreative.associations?.flight) {
    CampaignCreative.belongsTo(CampaignFlight, { foreignKey: 'flightId', as: 'flight' });
  }
}

export default CampaignCreative;
