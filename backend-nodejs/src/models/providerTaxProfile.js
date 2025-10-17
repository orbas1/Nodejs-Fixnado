import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import {
  encryptString,
  decryptString
} from '../utils/security/fieldEncryption.js';

class ProviderTaxProfile extends Model {}

ProviderTaxProfile.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    companyId: {
      field: 'company_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    registrationNumber: {
      field: 'registration_number_encrypted',
      type: DataTypes.TEXT,
      allowNull: true,
      set(value) {
        if (!value) {
          this.setDataValue('registrationNumber', null);
          return;
        }
        if (typeof value !== 'string') {
          throw new TypeError('registrationNumber must be a string');
        }
        const trimmed = value.trim();
        this.setDataValue(
          'registrationNumber',
          trimmed ? encryptString(trimmed, 'providerTax:registrationNumber') : null
        );
      },
      get() {
        const stored = this.getDataValue('registrationNumber');
        return stored ? decryptString(stored, 'providerTax:registrationNumber') : null;
      }
    },
    registrationCountry: {
      field: 'registration_country',
      type: DataTypes.STRING(2),
      allowNull: true
    },
    registrationRegion: {
      field: 'registration_region',
      type: DataTypes.STRING(120),
      allowNull: true
    },
    registrationStatus: {
      field: 'registration_status',
      type: DataTypes.ENUM('not_registered', 'pending', 'registered', 'suspended', 'deregistered'),
      allowNull: false,
      defaultValue: 'not_registered'
    },
    vatRegistered: {
      field: 'vat_registered',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    registrationEffectiveFrom: {
      field: 'registration_effective_from',
      type: DataTypes.DATE,
      allowNull: true
    },
    defaultRate: {
      field: 'default_rate',
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      defaultValue: 0
    },
    thresholdAmount: {
      field: 'threshold_amount',
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true
    },
    thresholdCurrency: {
      field: 'threshold_currency',
      type: DataTypes.STRING(3),
      allowNull: true
    },
    filingFrequency: {
      field: 'filing_frequency',
      type: DataTypes.ENUM('monthly', 'quarterly', 'semi_annual', 'annual'),
      allowNull: false,
      defaultValue: 'annual'
    },
    nextFilingDueAt: {
      field: 'next_filing_due_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    lastFiledAt: {
      field: 'last_filed_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    accountingMethod: {
      field: 'accounting_method',
      type: DataTypes.ENUM('accrual', 'cash'),
      allowNull: false,
      defaultValue: 'accrual'
    },
    certificateUrl: {
      field: 'certificate_url',
      type: DataTypes.TEXT,
      allowNull: true
    },
    exemptionReason: {
      field: 'exemption_reason',
      type: DataTypes.TEXT,
      allowNull: true
    },
    taxAdvisor: {
      field: 'tax_advisor',
      type: DataTypes.STRING(160),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'ProviderTaxProfile',
    tableName: 'ProviderTaxProfile'
  }
);

export default ProviderTaxProfile;
