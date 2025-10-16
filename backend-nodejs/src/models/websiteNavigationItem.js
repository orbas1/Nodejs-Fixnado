import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class WebsiteNavigationItem extends Model {}

WebsiteNavigationItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    menuId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    label: {
      type: DataTypes.STRING(180),
      allowNull: false
    },
    url: {
      type: DataTypes.STRING(1024),
      allowNull: false
    },
    icon: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    openInNewTab: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    visibility: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'public'
    },
    allowedRoles: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    analyticsTag: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    createdBy: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    updatedBy: {
      type: DataTypes.STRING(120),
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'WebsiteNavigationItem'
  }
);

export default WebsiteNavigationItem;
