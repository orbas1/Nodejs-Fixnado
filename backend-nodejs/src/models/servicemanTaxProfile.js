import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ServicemanTaxProfile extends Model {}

ServicemanTaxProfile.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    servicemanId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'serviceman_id'
    },
    filingStatus: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'sole_trader',
      field: 'filing_status'
    },
    residencyCountry: {
      type: DataTypes.STRING(2),
      allowNull: true,
      field: 'residency_country'
    },
    residencyRegion: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'residency_region'
    },
    vatRegistered: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'vat_registered'
    },
    vatNumber: {
      type: DataTypes.STRING(32),
      allowNull: true,
      field: 'vat_number'
    },
    utrNumber: {
      type: DataTypes.STRING(32),
      allowNull: true,
      field: 'utr_number'
    },
    companyNumber: {
      type: DataTypes.STRING(32),
      allowNull: true,
      field: 'company_number'
    },
    taxAdvisorName: {
      type: DataTypes.STRING(160),
      allowNull: true,
      field: 'tax_advisor_name'
    },
    taxAdvisorEmail: {
      type: DataTypes.STRING(160),
      allowNull: true,
      field: 'tax_advisor_email'
    },
    taxAdvisorPhone: {
      type: DataTypes.STRING(48),
      allowNull: true,
      field: 'tax_advisor_phone'
    },
    remittanceCycle: {
      type: DataTypes.STRING(24),
      allowNull: false,
      defaultValue: 'monthly',
      field: 'remittance_cycle'
    },
    withholdingRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'withholding_rate'
    },
    lastFilingSubmittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_filing_submitted_at'
    },
    nextDeadlineAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'next_deadline_at'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'ServicemanTaxProfile',
    tableName: 'serviceman_tax_profiles',
    underscored: true
  }
);

export default ServicemanTaxProfile;
