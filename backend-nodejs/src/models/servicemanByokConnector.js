import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ServicemanByokConnector extends Model {}

ServicemanByokConnector.init(
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
    provider: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    displayName: {
      type: DataTypes.STRING(160),
      allowNull: false,
      field: 'display_name'
    },
    environment: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'production'
    },
    status: {
      type: DataTypes.STRING(24),
      allowNull: false,
      defaultValue: 'active'
    },
    secretEncrypted: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'secret_encrypted'
    },
    secretLastFour: {
      type: DataTypes.STRING(8),
      allowNull: false,
      field: 'secret_last_four'
    },
    scopes: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: () => []
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: () => ({})
    },
    rotatesAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'rotates_at'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'created_by'
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'updated_by'
    }
  },
  {
    sequelize,
    modelName: 'ServicemanByokConnector',
    tableName: 'serviceman_byok_connectors',
    underscored: true
  }
);

export default ServicemanByokConnector;
