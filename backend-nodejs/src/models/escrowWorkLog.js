import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class EscrowWorkLog extends Model {}

EscrowWorkLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    escrowId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'escrow_id'
    },
    milestoneId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'milestone_id'
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'author_id'
    },
    logType: {
      type: DataTypes.STRING(48),
      allowNull: false,
      defaultValue: 'update',
      field: 'log_type'
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'duration_minutes'
    },
    evidenceUrl: {
      type: DataTypes.STRING(512),
      allowNull: true,
      field: 'evidence_url'
    }
  },
  {
    sequelize,
    modelName: 'EscrowWorkLog'
  }
);

export default EscrowWorkLog;
