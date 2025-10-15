import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ConsentEvent extends Model {}

ConsentEvent.init(
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
    subjectId: {
      type: DataTypes.STRING(64),
      allowNull: false,
      field: 'subject_id'
    },
    policyKey: {
      type: DataTypes.STRING(64),
      allowNull: false,
      field: 'policy_key'
    },
    policyVersion: {
      type: DataTypes.STRING(32),
      allowNull: false,
      field: 'policy_version'
    },
    decision: {
      type: DataTypes.ENUM('granted', 'withdrawn'),
      allowNull: false
    },
    decisionAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'decision_at',
      defaultValue: DataTypes.NOW
    },
    region: {
      type: DataTypes.STRING(8),
      allowNull: false,
      defaultValue: 'GB'
    },
    channel: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'web'
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
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  },
  {
    sequelize,
    modelName: 'ConsentEvent',
    tableName: 'consent_events',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default ConsentEvent;
