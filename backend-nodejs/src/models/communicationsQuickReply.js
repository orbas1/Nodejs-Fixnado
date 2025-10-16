import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class CommunicationsQuickReply extends Model {}

CommunicationsQuickReply.init(
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
    title: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    category: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sort_order'
    },
    allowedRoles: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      field: 'allowed_roles'
    },
    createdBy: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: 'created_by'
    },
    updatedBy: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: 'updated_by'
    }
  },
  {
    sequelize,
    modelName: 'CommunicationsQuickReply',
    tableName: 'CommunicationsQuickReply'
  }
);

export default CommunicationsQuickReply;
