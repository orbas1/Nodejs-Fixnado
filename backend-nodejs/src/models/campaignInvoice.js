import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class CampaignInvoice extends Model {}

CampaignInvoice.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    campaignId: {
      field: 'campaign_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    flightId: {
      field: 'flight_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    invoiceNumber: {
      field: 'invoice_number',
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'GBP'
    },
    amountDue: {
      field: 'amount_due',
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false
    },
    amountPaid: {
      field: 'amount_paid',
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0
    },
    periodStart: {
      field: 'period_start',
      type: DataTypes.DATE,
      allowNull: false
    },
    periodEnd: {
      field: 'period_end',
      type: DataTypes.DATE,
      allowNull: false
    },
    dueDate: {
      field: 'due_date',
      type: DataTypes.DATE,
      allowNull: false
    },
    issuedAt: {
      field: 'issued_at',
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    paidAt: {
      field: 'paid_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('draft', 'issued', 'paid', 'overdue', 'void'),
      allowNull: false,
      defaultValue: 'issued'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    regionId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'region_id'
    }
  },
  {
    sequelize,
    modelName: 'CampaignInvoice',
    tableName: 'CampaignInvoice'
  }
);

export default CampaignInvoice;
