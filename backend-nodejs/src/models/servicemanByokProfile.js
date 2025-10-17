import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ServicemanByokProfile extends Model {}

ServicemanByokProfile.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'user_id'
    },
    displayName: {
      type: DataTypes.STRING(160),
      allowNull: false,
      field: 'display_name',
      defaultValue: 'Crew BYOK profile'
    },
    defaultProvider: {
      type: DataTypes.STRING(64),
      allowNull: false,
      field: 'default_provider',
      defaultValue: 'openai'
    },
    defaultEnvironment: {
      type: DataTypes.STRING(32),
      allowNull: false,
      field: 'default_environment',
      defaultValue: 'production'
    },
    rotationPolicyDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'rotation_policy_days',
      defaultValue: 90
    },
    allowSelfProvisioning: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: 'allow_self_provisioning',
      defaultValue: false
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: () => ({})
    }
  },
  {
    sequelize,
    modelName: 'ServicemanByokProfile',
    tableName: 'serviceman_byok_profiles',
    underscored: true
  }
);

export default ServicemanByokProfile;
