import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class RbacRolePermission extends Model {}

RbacRolePermission.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'role_id'
    },
    permission: {
      type: DataTypes.STRING(128),
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'RbacRolePermission',
    tableName: 'rbac_role_permissions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default RbacRolePermission;
