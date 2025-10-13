import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

const ALLOWED_STATUSES = ['success', 'failed', 'skipped', 'idle'];

class AnalyticsPipelineRun extends Model {
  get durationMs() {
    if (!this.startedAt || !this.finishedAt) {
      return null;
    }

    const duration = this.finishedAt.getTime() - this.startedAt.getTime();
    return Number.isFinite(duration) && duration > 0 ? duration : 0;
  }

  toJSON() {
    const values = { ...super.toJSON() };
    values.durationMs = this.durationMs;
    return values;
  }
}

AnalyticsPipelineRun.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    status: {
      type: DataTypes.STRING(16),
      allowNull: false,
      validate: {
        isIn: [ALLOWED_STATUSES]
      }
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'started_at'
    },
    finishedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'finished_at'
    },
    eventsProcessed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'events_processed'
    },
    eventsFailed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'events_failed'
    },
    batchesDelivered: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'batches_delivered'
    },
    purgedEvents: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'purged_events'
    },
    triggeredBy: {
      type: DataTypes.STRING(96),
      allowNull: false,
      defaultValue: 'scheduler',
      field: 'triggered_by'
    },
    lastError: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'last_error'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'AnalyticsPipelineRun',
    tableName: 'AnalyticsPipelineRun',
    underscored: true,
    indexes: [
      { fields: ['status'], name: 'analytics_pipeline_run_status' },
      { fields: ['started_at'], name: 'analytics_pipeline_run_started_at' }
    ]
  }
);

export default AnalyticsPipelineRun;
