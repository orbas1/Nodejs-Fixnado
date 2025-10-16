import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class AppearanceVariant extends Model {}

AppearanceVariant.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    profileId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'profile_id'
    },
    variantKey: {
      type: DataTypes.STRING(120),
      allowNull: false,
      field: 'variant_key'
    },
    name: {
      type: DataTypes.STRING(180),
      allowNull: false
    },
    headline: {
      type: DataTypes.STRING(280)
    },
    subheadline: {
      type: DataTypes.TEXT
    },
    ctaLabel: {
      type: DataTypes.STRING(140),
      field: 'cta_label'
    },
    ctaUrl: {
      type: DataTypes.STRING(512),
      field: 'cta_url'
    },
    heroImageUrl: {
      type: DataTypes.STRING(512),
      field: 'hero_image_url'
    },
    heroVideoUrl: {
      type: DataTypes.STRING(512),
      field: 'hero_video_url'
    },
    marketingCopy: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      field: 'marketing_copy'
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sort_order'
    },
    publishState: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'draft',
      field: 'publish_state'
    },
    scheduledFor: {
      type: DataTypes.DATE,
      field: 'scheduled_for'
    },
    archivedAt: {
      type: DataTypes.DATE,
      field: 'archived_at'
    },
    createdBy: {
      type: DataTypes.STRING(120),
      field: 'created_by'
    },
    updatedBy: {
      type: DataTypes.STRING(120),
      field: 'updated_by'
    }
  },
  {
    sequelize,
    modelName: 'AppearanceVariant'
  }
);

export default AppearanceVariant;
