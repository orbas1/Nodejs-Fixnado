import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class RentalAgreement extends Model {}

RentalAgreement.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    rentalNumber: {
      field: 'rental_number',
      type: DataTypes.STRING(24),
      allowNull: false,
      unique: true
    },
    itemId: {
      field: 'item_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    marketplaceItemId: {
      field: 'marketplace_item_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    companyId: {
      field: 'company_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    renterId: {
      field: 'renter_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    bookingId: {
      field: 'booking_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM(
        'requested',
        'approved',
        'pickup_scheduled',
        'in_use',
        'return_pending',
        'inspection_pending',
        'settled',
        'cancelled',
        'disputed'
      ),
      allowNull: false,
      defaultValue: 'requested'
    },
    depositStatus: {
      field: 'deposit_status',
      type: DataTypes.ENUM('pending', 'held', 'released', 'forfeited', 'partially_released'),
      allowNull: false,
      defaultValue: 'pending'
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    rentalStartAt: {
      field: 'rental_start_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    rentalEndAt: {
      field: 'rental_end_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    pickupAt: {
      field: 'pickup_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    returnDueAt: {
      field: 'return_due_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    returnedAt: {
      field: 'returned_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    depositAmount: {
      field: 'deposit_amount',
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    depositCurrency: {
      field: 'deposit_currency',
      type: DataTypes.STRING(3),
      allowNull: true
    },
    dailyRate: {
      field: 'daily_rate',
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    rateCurrency: {
      field: 'rate_currency',
      type: DataTypes.STRING(3),
      allowNull: true
    },
    conditionOut: {
      field: 'condition_out',
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    conditionIn: {
      field: 'condition_in',
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    meta: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    cancellationReason: {
      field: 'cancellation_reason',
      type: DataTypes.STRING(255),
      allowNull: true
    },
    lastStatusTransitionAt: {
      field: 'last_status_transition_at',
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'RentalAgreement',
    tableName: 'RentalAgreement'
  }
);

export default RentalAgreement;
