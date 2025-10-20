import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

const isSqlite = sequelize.getDialect() === 'sqlite';
const labelsDataType = isSqlite ? DataTypes.JSON : DataTypes.ARRAY(DataTypes.STRING);

export const ADMIN_USER_STATUSES = ['active', 'invited', 'suspended', 'deactivated'];

class AdminUserProfile extends Model {}

AdminUserProfile.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id'
    },
    status: {
      type: DataTypes.ENUM(...ADMIN_USER_STATUSES),
      allowNull: false,
      defaultValue: 'active'
    },
    labels: {
      type: labelsDataType,
      allowNull: false,
      defaultValue: () => []
    },
    jobTitle: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'job_title'
    },
    department: {
      type: DataTypes.STRING,
      allowNull: true
    },
    avatarUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'avatar_url'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'display_name'
    },
    searchTerms: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'search_terms'
    }
  },
  {
    sequelize,
    modelName: 'AdminUserProfile',
    tableName: 'admin_user_profiles',
    underscored: true
  }
);

export default AdminUserProfile;
