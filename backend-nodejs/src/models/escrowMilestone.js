import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class EscrowMilestone extends Model {}

EscrowMilestone.init(
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
    label: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'submitted', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    },
    sequence: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    dueAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'due_at'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at'
    },
    evidenceUrl: {
      type: DataTypes.STRING(512),
      allowNull: true,
      field: 'evidence_url'
    }
  },
  {
    sequelize,
    modelName: 'EscrowMilestone'
  }
);

export default EscrowMilestone;
