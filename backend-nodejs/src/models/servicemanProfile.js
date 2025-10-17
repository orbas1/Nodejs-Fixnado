import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ServicemanProfile extends Model {}

ServicemanProfile.init(
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
      allowNull: true,
      field: 'display_name'
    },
    callSign: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'call_sign'
    },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'active'
    },
    avatarUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'avatar_url'
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    timezone: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    primaryRegion: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: 'primary_region'
    },
    coverageRadiusKm: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 25,
      field: 'coverage_radius_km'
    },
    travelBufferMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
      field: 'travel_buffer_minutes'
    },
    autoAcceptAssignments: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'auto_accept_assignments'
    },
    allowAfterHours: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'allow_after_hours'
    },
    notifyOpsTeam: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'notify_ops_team'
    },
    defaultVehicle: {
      type: DataTypes.STRING(96),
      allowNull: true,
      field: 'default_vehicle'
    }
  },
  {
    sequelize,
    modelName: 'ServicemanProfile',
    tableName: 'serviceman_profiles',
    underscored: true
  }
);

export default ServicemanProfile;
