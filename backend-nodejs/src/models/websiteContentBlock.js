import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class WebsiteContentBlock extends Model {}

WebsiteContentBlock.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    pageId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    subtitle: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    layout: {
      type: DataTypes.STRING(60),
      allowNull: false,
      defaultValue: 'stacked'
    },
    accentColor: {
      type: DataTypes.STRING(32),
      allowNull: true
    },
    backgroundImageUrl: {
      type: DataTypes.STRING(1024),
      allowNull: true
    },
    media: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    allowedRoles: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    analyticsTag: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    embedUrl: {
      type: DataTypes.STRING(1024),
      allowNull: true
    },
    ctaLabel: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    ctaUrl: {
      type: DataTypes.STRING(1024),
      allowNull: true
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    isVisible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
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
    modelName: 'WebsiteContentBlock'
  }
);

export default WebsiteContentBlock;
