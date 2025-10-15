import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class WarehouseExportRun extends Model {}

WarehouseExportRun.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    dataset: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'running', 'succeeded', 'failed'),
      allowNull: false,
      defaultValue: 'pending'
    },
    regionId: {
      field: 'region_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    triggeredBy: {
      field: 'triggered_by',
      type: DataTypes.UUID,
      allowNull: true
    },
    runStartedAt: {
      field: 'run_started_at',
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    runFinishedAt: {
      field: 'run_finished_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    rowCount: {
      field: 'row_count',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    filePath: {
      field: 'file_path',
      type: DataTypes.STRING(512),
      allowNull: true
    },
    lastCursor: {
      field: 'last_cursor',
      type: DataTypes.JSONB,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'WarehouseExportRun',
    tableName: 'warehouse_export_runs',
    underscored: true
  }
);

export default WarehouseExportRun;
