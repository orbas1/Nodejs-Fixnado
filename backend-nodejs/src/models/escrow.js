import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Escrow extends Model {}

Escrow.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'GBP'
    },
    fundedAt: DataTypes.DATE,
    releasedAt: DataTypes.DATE,
    status: {
      type: DataTypes.ENUM('pending', 'funded', 'released', 'disputed'),
      defaultValue: 'pending'
    },
    externalReference: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: 'external_reference'
    },
    policyId: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: 'policy_id'
    },
    requiresDualApproval: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'requires_dual_approval'
    },
    autoReleaseAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'auto_release_at'
    },
    onHold: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'on_hold'
    },
    holdReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'hold_reason'
    },
    regionId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'region_id'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: () => ({})
    }
  },
  {
    sequelize,
    modelName: 'Escrow'
  }
);

export default Escrow;
