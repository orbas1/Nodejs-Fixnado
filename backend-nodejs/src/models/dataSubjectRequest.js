import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class DataSubjectRequest extends Model {}

DataSubjectRequest.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      field: 'user_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    subjectEmail: {
      field: 'subject_email',
      type: DataTypes.STRING(320),
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    requestType: {
      field: 'request_type',
      type: DataTypes.ENUM('access', 'erasure', 'rectification'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('received', 'in_progress', 'completed', 'rejected'),
      allowNull: false,
      defaultValue: 'received'
    },
    requestedAt: {
      field: 'requested_at',
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    processedAt: {
      field: 'processed_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    regionId: {
      field: 'region_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    payloadLocation: {
      field: 'payload_location',
      type: DataTypes.STRING(512),
      allowNull: true
    },
    auditLog: {
      field: 'audit_log',
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'DataSubjectRequest',
    tableName: 'data_subject_requests',
    updatedAt: 'updated_at',
    createdAt: 'created_at'
  }
);

export default DataSubjectRequest;
