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
      allowNull: true
    },
    actorRole: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    eventType: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    action: {
      type: DataTypes.STRING(128),
      allowNull: false
    },
    subjectType: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    subjectId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    ipAddress: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    userAgent: {
      type: DataTypes.STRING(512),
      allowNull: true
    },
    requestId: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'SecurityAuditEvent',
    tableName: 'security_audit_events'
  }
);

export default SecurityAuditEvent;
