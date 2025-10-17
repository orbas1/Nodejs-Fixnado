import { DataTypes } from 'sequelize';

const TAX_REGISTRATION_STATUSES = [
  'not_registered',
  'pending',
  'registered',
  'suspended',
  'deregistered'
];

const TAX_ACCOUNTING_METHODS = ['accrual', 'cash'];

const TAX_FILING_FREQUENCIES = ['monthly', 'quarterly', 'semi_annual', 'annual'];

const TAX_FILING_STATUSES = ['draft', 'scheduled', 'filed', 'paid', 'overdue', 'cancelled'];

export async function up(queryInterface) {
  await queryInterface.createTable('ProviderTaxProfile', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    company_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Company',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    registration_number_encrypted: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    registration_country: {
      type: DataTypes.STRING(2),
      allowNull: true
    },
    registration_region: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    registration_status: {
      type: DataTypes.ENUM(...TAX_REGISTRATION_STATUSES),
      allowNull: false,
      defaultValue: 'not_registered'
    },
    vat_registered: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    registration_effective_from: {
      type: DataTypes.DATE,
      allowNull: true
    },
    default_rate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      defaultValue: 0
    },
    threshold_amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true
    },
    threshold_currency: {
      type: DataTypes.STRING(3),
      allowNull: true
    },
    filing_frequency: {
      type: DataTypes.ENUM(...TAX_FILING_FREQUENCIES),
      allowNull: false,
      defaultValue: 'annual'
    },
    next_filing_due_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_filed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    accounting_method: {
      type: DataTypes.ENUM(...TAX_ACCOUNTING_METHODS),
      allowNull: false,
      defaultValue: 'accrual'
    },
    certificate_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    exemption_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    tax_advisor: {
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
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  await queryInterface.addIndex('ProviderTaxProfile', ['company_id'], {
    unique: true,
    name: 'provider_tax_profile_company_idx'
  });

  await queryInterface.createTable('ProviderTaxFiling', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    company_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Company',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    period_start: {
      type: DataTypes.DATE,
      allowNull: false
    },
    period_end: {
      type: DataTypes.DATE,
      allowNull: false
    },
    due_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    filed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM(...TAX_FILING_STATUSES),
      allowNull: false,
      defaultValue: 'scheduled'
    },
    taxable_sales_amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true
    },
    tax_collected_amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true
    },
    tax_due_amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'GBP'
    },
    reference_number: {
      type: DataTypes.STRING(160),
      allowNull: true
    },
    submitted_by: {
      type: DataTypes.STRING(160),
      allowNull: true
    },
    supporting_document_url: {
      type: DataTypes.TEXT,
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
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  await queryInterface.addIndex('ProviderTaxFiling', ['company_id', 'period_start'], {
    name: 'provider_tax_filing_period_idx'
  });

  await queryInterface.addIndex('ProviderTaxFiling', ['status'], {
    name: 'provider_tax_filing_status_idx'
  });
}

export async function down(queryInterface) {
  await queryInterface.removeIndex('ProviderTaxFiling', 'provider_tax_filing_status_idx');
  await queryInterface.removeIndex('ProviderTaxFiling', 'provider_tax_filing_period_idx');
  await queryInterface.dropTable('ProviderTaxFiling');

  await queryInterface.removeIndex('ProviderTaxProfile', 'provider_tax_profile_company_idx');
  await queryInterface.dropTable('ProviderTaxProfile');

  await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_ProviderTaxProfile_registration_status\" CASCADE;");
  await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_ProviderTaxProfile_filing_frequency\" CASCADE;");
  await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_ProviderTaxProfile_accounting_method\" CASCADE;");
  await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_ProviderTaxFiling_status\" CASCADE;");
}
