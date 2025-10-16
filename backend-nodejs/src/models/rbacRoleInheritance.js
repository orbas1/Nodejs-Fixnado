import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class RbacRoleInheritance extends Model {}

RbacRoleInheritance.init(
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
    parentRoleId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'parent_role_id'
    },
    parentRoleKey: {
      type: DataTypes.STRING(64),
      allowNull: false,
      field: 'parent_role_key'
    }
  },
  {
    sequelize,
    modelName: 'RbacRoleInheritance',
    tableName: 'rbac_role_inheritances',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default RbacRoleInheritance;
