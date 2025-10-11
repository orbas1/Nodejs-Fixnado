import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class RentalCheckpoint extends Model {}

RentalCheckpoint.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    rentalAgreementId: {
      field: 'rental_agreement_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('note', 'status_change', 'handover', 'return', 'inspection', 'deposit'),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    recordedBy: {
      field: 'recorded_by',
      type: DataTypes.UUID,
      allowNull: false
    },
    recordedByRole: {
      field: 'recorded_by_role',
      type: DataTypes.ENUM('provider', 'customer', 'system', 'admin'),
      allowNull: false
    },
    occurredAt: {
      field: 'occurred_at',
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'RentalCheckpoint',
    tableName: 'RentalCheckpoint'
  }
);

export default RentalCheckpoint;
