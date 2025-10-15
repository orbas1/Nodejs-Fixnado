import { randomUUID } from 'node:crypto';

export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('payments', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    order_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Orders', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    buyer_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    provider_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    service_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Services', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    amount: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false
    },
    currency: {
      type: Sequelize.STRING(3),
      allowNull: false
    },
    status: {
      type: Sequelize.ENUM('pending', 'authorised', 'captured', 'refunded', 'cancelled', 'failed'),
      allowNull: false,
      defaultValue: 'pending'
    },
    gateway_reference: {
      type: Sequelize.STRING(128),
      allowNull: true
    },
    fingerprint: {
      type: Sequelize.STRING(128),
      allowNull: true,
      unique: true
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    captured_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    refunded_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    region_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Region', key: 'id' },
      onUpdate: 'CASCADE',
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

  await queryInterface.createTable('payout_requests', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    provider_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    payment_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'payments', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    amount: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false
    },
    currency: {
      type: Sequelize.STRING(3),
      allowNull: false
    },
    status: {
      type: Sequelize.ENUM('pending', 'approved', 'processing', 'paid', 'failed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    scheduled_for: {
      type: Sequelize.DATE,
      allowNull: true
    },
    processed_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    failure_reason: {
      type: Sequelize.STRING(256),
      allowNull: true
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    region_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Region', key: 'id' },
      onUpdate: 'CASCADE',
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

  await queryInterface.createTable('finance_invoices', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    order_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Orders', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    invoice_number: {
      type: Sequelize.STRING(48),
      allowNull: false,
      unique: true
    },
    amount_due: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false
    },
    amount_paid: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    currency: {
      type: Sequelize.STRING(3),
      allowNull: false
    },
    status: {
      type: Sequelize.ENUM('draft', 'issued', 'paid', 'overdue', 'cancelled'),
      allowNull: false,
      defaultValue: 'draft'
    },
    issued_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    due_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    paid_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    pdf_url: {
      type: Sequelize.STRING(512),
      allowNull: true
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    region_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Region', key: 'id' },
      onUpdate: 'CASCADE',
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

  await queryInterface.createTable('finance_webhook_events', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    provider: {
      type: Sequelize.STRING(32),
      allowNull: false
    },
    event_type: {
      type: Sequelize.STRING(64),
      allowNull: false
    },
    payload: {
      type: Sequelize.JSONB,
      allowNull: false
    },
    status: {
      type: Sequelize.ENUM('queued', 'processing', 'succeeded', 'failed', 'discarded'),
      allowNull: false,
      defaultValue: 'queued'
    },
    attempts: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    last_error: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    next_retry_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    order_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Orders', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    payment_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'payments', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    escrow_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Escrows', key: 'id' },
      onUpdate: 'CASCADE',
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

  await queryInterface.addColumn('escrows', 'amount', {
    type: Sequelize.DECIMAL(12, 2),
    allowNull: true
  });
  await queryInterface.addColumn('escrows', 'currency', {
    type: Sequelize.STRING(3),
    allowNull: true
  });
  await queryInterface.addColumn('escrows', 'external_reference', {
    type: Sequelize.STRING(128),
    allowNull: true
  });

  await queryInterface.addColumn('disputes', 'opened_at', {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW
  });
  await queryInterface.addColumn('disputes', 'closed_at', {
    type: Sequelize.DATE,
    allowNull: true
  });
  await queryInterface.addColumn('disputes', 'evidence', {
    type: Sequelize.JSONB,
    allowNull: false,
    defaultValue: {}
  });

  await queryInterface.addColumn('finance_transaction_histories', 'payment_id', {
    type: Sequelize.UUID,
    allowNull: true,
    references: { model: 'payments', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  });
  await queryInterface.addColumn('finance_transaction_histories', 'payout_request_id', {
    type: Sequelize.UUID,
    allowNull: true,
    references: { model: 'payout_requests', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  });
  await queryInterface.addColumn('finance_transaction_histories', 'invoice_id', {
    type: Sequelize.UUID,
    allowNull: true,
    references: { model: 'finance_invoices', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  });

  await queryInterface.addIndex('payments', ['order_id']);
  await queryInterface.addIndex('payments', ['provider_id']);
  await queryInterface.addIndex('payments', ['status']);
  await queryInterface.addIndex('payout_requests', ['provider_id', 'status']);
  await queryInterface.addIndex('finance_invoices', ['order_id']);
  await queryInterface.addIndex('finance_webhook_events', ['status', 'next_retry_at']);

  const now = new Date();
  await queryInterface.bulkInsert('finance_transaction_histories', [
    {
      id: randomUUID(),
      event_type: 'migration.bootstrap',
      occurred_at: now,
      snapshot: {
        note: 'Payments orchestration tables initialised',
        version: '2025-03-25'
      },
      created_at: now,
      updated_at: now
    }
  ]);
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeColumn('finance_transaction_histories', 'invoice_id');
  await queryInterface.removeColumn('finance_transaction_histories', 'payout_request_id');
  await queryInterface.removeColumn('finance_transaction_histories', 'payment_id');

  await queryInterface.removeColumn('disputes', 'evidence');
  await queryInterface.removeColumn('disputes', 'closed_at');
  await queryInterface.removeColumn('disputes', 'opened_at');

  await queryInterface.removeColumn('escrows', 'external_reference');
  await queryInterface.removeColumn('escrows', 'currency');
  await queryInterface.removeColumn('escrows', 'amount');

  await queryInterface.dropTable('finance_webhook_events');
  await queryInterface.dropTable('finance_invoices');
  await queryInterface.dropTable('payout_requests');
  await queryInterface.dropTable('payments');

  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_finance_webhook_events_status"');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_finance_invoices_status"');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_payout_requests_status"');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_payments_status"');
}
