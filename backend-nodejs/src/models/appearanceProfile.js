import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class AppearanceProfile extends Model {}

AppearanceProfile.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(180),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_default'
    },
    allowedRoles: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      field: 'allowed_roles'
    },
    colorPalette: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      field: 'color_palette'
    },
    typography: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    layout: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    imagery: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    widgets: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    governance: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    publishedAt: {
      type: DataTypes.DATE,
      field: 'published_at'
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
    modelName: 'AppearanceProfile'
  }
);

export default AppearanceProfile;
