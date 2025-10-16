import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ServicemanByokAuditEvent extends Model {}

ServicemanByokAuditEvent.init(
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
    connectorId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'connector_id'
    },
    action: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(24),
      allowNull: false,
      defaultValue: 'success'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    actorId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'actor_id'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: () => ({})
    }
  },
  {
    sequelize,
    modelName: 'ServicemanByokAuditEvent',
    tableName: 'serviceman_byok_audit_events',
    underscored: true,
    updatedAt: false
  }
);

export default ServicemanByokAuditEvent;
