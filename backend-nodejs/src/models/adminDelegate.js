import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class AdminDelegate extends Model {}

AdminDelegate.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    adminProfileId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'admin_profile_id'
    },
    name: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    role: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    permissions: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    avatarUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'avatar_url'
    },
    status: {
      type: DataTypes.ENUM('active', 'suspended'),
      allowNull: false,
      defaultValue: 'active'
    }
  },
  {
    sequelize,
    modelName: 'AdminDelegate',
    tableName: 'AdminDelegate'
  }
);

export default AdminDelegate;
