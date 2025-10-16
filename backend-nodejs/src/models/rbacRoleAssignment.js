import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class RbacRoleAssignment extends Model {}

RbacRoleAssignment.init(
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
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id'
    },
    tenantId: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'tenant_id'
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_at'
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'revoked_at'
    },
    assignedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'assigned_by'
    }
  },
  {
    sequelize,
    modelName: 'RbacRoleAssignment',
    tableName: 'rbac_role_assignments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default RbacRoleAssignment;
