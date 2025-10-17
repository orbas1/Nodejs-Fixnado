import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class EnterpriseUpgradeDocument extends Model {}

EnterpriseUpgradeDocument.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    upgradeRequestId: {
      field: 'upgrade_request_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(180),
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(60),
      allowNull: true
    },
    url: {
      type: DataTypes.STRING(512),
      allowNull: false
    },
    thumbnailUrl: {
      field: 'thumbnail_url',
      type: DataTypes.STRING(512),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'EnterpriseUpgradeDocument',
    tableName: 'enterprise_upgrade_documents',
    underscored: true
  }
);

export default EnterpriseUpgradeDocument;
