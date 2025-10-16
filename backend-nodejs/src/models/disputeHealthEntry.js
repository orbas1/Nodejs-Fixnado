import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class DisputeHealthEntry extends Model {}

DisputeHealthEntry.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    bucketId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'bucket_id'
    },
    periodStart: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'period_start'
    },
    periodEnd: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'period_end'
    },
    escalatedCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'escalated_count'
    },
    resolvedCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'resolved_count'
    },
    reopenedCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'reopened_count'
    },
    backlogCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'backlog_count'
    },
    ownerNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'owner_notes'
    },
    attachments: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'created_by'
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'updated_by'
    }
  },
  {
    sequelize,
    modelName: 'DisputeHealthEntry',
    tableName: 'dispute_health_entries',
    underscored: true
  }
);

export default DisputeHealthEntry;
