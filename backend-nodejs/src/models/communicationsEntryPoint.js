import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class CommunicationsEntryPoint extends Model {}

CommunicationsEntryPoint.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    configurationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'configuration_id'
    },
    key: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    label: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    defaultMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'default_message'
    },
    icon: {
      type: DataTypes.STRING(16),
      allowNull: true
    },
    imageUrl: {
      type: DataTypes.STRING(512),
      allowNull: true,
      field: 'image_url'
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'display_order'
    },
    ctaLabel: {
      type: DataTypes.STRING(80),
      allowNull: true,
      field: 'cta_label'
    },
    ctaUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'cta_url'
    },
    updatedBy: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: 'updated_by'
    }
  },
  {
    sequelize,
    modelName: 'CommunicationsEntryPoint',
    tableName: 'CommunicationsEntryPoint'
  }
);

export default CommunicationsEntryPoint;
