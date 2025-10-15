import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class SecurityAuditEvent extends Model {}

SecurityAuditEvent.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'user_id'
    },
    actorRole: {
      type: DataTypes.STRING(64),
      allowNull: false,
      field: 'actor_role'
    },
    actorPersona: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'actor_persona'
    },
    resource: {
      type: DataTypes.STRING(128),
      allowNull: false
    },
    action: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    decision: {
      type: DataTypes.ENUM('allow', 'deny'),
      allowNull: false
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    ipAddress: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'ip_address'
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent'
    },
    correlationId: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'correlation_id'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  },
  {
    sequelize,
    modelName: 'SecurityAuditEvent',
    tableName: 'security_audit_events',
    createdAt: 'created_at',
    updatedAt: false
  }
);

export default SecurityAuditEvent;
