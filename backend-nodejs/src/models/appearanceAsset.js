import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class AppearanceAsset extends Model {}

AppearanceAsset.init(
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
    assetType: {
      type: DataTypes.STRING(60),
      allowNull: false,
      field: 'asset_type'
    },
    label: {
      type: DataTypes.STRING(180),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    url: {
      type: DataTypes.STRING(512),
      allowNull: false
    },
    altText: {
      type: DataTypes.STRING(256),
      field: 'alt_text'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sort_order'
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
    modelName: 'AppearanceAsset'
  }
);

export default AppearanceAsset;
