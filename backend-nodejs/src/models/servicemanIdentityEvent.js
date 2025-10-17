import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ServicemanIdentityEvent extends Model {}

ServicemanIdentityEvent.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    identityId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    eventType: {
      type: DataTypes.ENUM(
        'note',
        'status_change',
        'document_update',
        'check_update',
        'watcher_update',
        'escalation',
        'review_request',
        'expiry'
      ),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    occurredAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    actorId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'ServicemanIdentityEvent',
    tableName: 'ServicemanIdentityEvent'
  }
);

export default ServicemanIdentityEvent;
