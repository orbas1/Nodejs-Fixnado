import { SERVICEMAN_PAYMENT_STATUSES } from '../../models/servicemanPayment.js';
import {
  SERVICEMAN_COMMISSION_APPROVAL_STATUSES,
  SERVICEMAN_COMMISSION_RATE_TYPES
} from '../../models/servicemanCommissionRule.js';

export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('serviceman_commission_rules', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    company_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Company', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    name: {
      type: Sequelize.STRING(160),
      allowNull: false
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    applies_to_role: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    service_category: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    rate_type: {
      type: Sequelize.ENUM(...SERVICEMAN_COMMISSION_RATE_TYPES),
      allowNull: false,
      defaultValue: 'percentage'
    },
    rate_value: {
      type: Sequelize.DECIMAL(10, 4),
      allowNull: false,
      defaultValue: 0
    },
    minimum_booking_value: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true
    },
    maximum_commission_value: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true
    },
    auto_apply: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_default: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    approval_status: {
      type: Sequelize.ENUM(...SERVICEMAN_COMMISSION_APPROVAL_STATUSES),
      allowNull: false,
      defaultValue: 'draft'
    },
    effective_from: {
      type: Sequelize.DATE,
      allowNull: true
    },
    effective_to: {
      type: Sequelize.DATE,
      allowNull: true
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    created_by: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      onUpdate: 'SET NULL',
      onDelete: 'SET NULL'
    },
    updated_by: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      onUpdate: 'SET NULL',
      onDelete: 'SET NULL'
    },
    archived_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    }
  });

  await queryInterface.createTable('serviceman_payments', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    company_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Company', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    serviceman_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'ProviderContact', key: 'id' },
      onUpdate: 'SET NULL',
      onDelete: 'SET NULL'
    },
    serviceman_name: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    serviceman_role: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    serviceman_snapshot: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    booking_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Booking', key: 'id' },
      onUpdate: 'SET NULL',
      onDelete: 'SET NULL'
    },
    booking_reference: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    booking_service_name: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    booking_snapshot: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    commission_rule_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'serviceman_commission_rules', key: 'id' },
      onUpdate: 'SET NULL',
      onDelete: 'SET NULL'
    },
    amount: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false
    },
    currency: {
      type: Sequelize.STRING(3),
      allowNull: false,
      defaultValue: 'GBP'
    },
    status: {
      type: Sequelize.ENUM(...SERVICEMAN_PAYMENT_STATUSES),
      allowNull: false,
      defaultValue: 'scheduled'
    },
    commission_rate: {
      type: Sequelize.DECIMAL(10, 4),
      allowNull: true
    },
    commission_amount: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true
    },
    due_date: {
      type: Sequelize.DATE,
      allowNull: true
    },
    paid_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    notes: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    created_by: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      onUpdate: 'SET NULL',
      onDelete: 'SET NULL'
    },
    updated_by: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      onUpdate: 'SET NULL',
      onDelete: 'SET NULL'
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    }
  });

  await Promise.all([
    queryInterface.addIndex('serviceman_commission_rules', ['company_id']),
    queryInterface.addIndex('serviceman_commission_rules', ['approval_status']),
    queryInterface.addIndex('serviceman_commission_rules', ['is_default']),
    queryInterface.addIndex('serviceman_payments', ['company_id']),
    queryInterface.addIndex('serviceman_payments', ['serviceman_id']),
    queryInterface.addIndex('serviceman_payments', ['booking_id']),
    queryInterface.addIndex('serviceman_payments', ['status']),
    queryInterface.addIndex('serviceman_payments', ['due_date'])
  ]);
}

export async function down({ context: queryInterface, Sequelize }) {
  await queryInterface.dropTable('serviceman_payments');
  await queryInterface.dropTable('serviceman_commission_rules');

  if (queryInterface.sequelize.getDialect() === 'postgres') {
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_serviceman_payments_status"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_serviceman_commission_rules_rate_type"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_serviceman_commission_rules_approval_status"');
  }
}
