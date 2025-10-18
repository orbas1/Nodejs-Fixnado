import { v5 as uuidv5 } from 'uuid';

const UUID_NAMESPACE = uuidv5('fixnado:payments-orchestration:2025-03-25', uuidv5.URL);

function deterministicId(token) {
  return uuidv5(token, UUID_NAMESPACE);
}

const FINANCE_WEBHOOK_STATUS = ['queued', 'processing', 'succeeded', 'failed', 'discarded'];
const PAYMENT_STATUS = ['pending', 'authorised', 'captured', 'refunded', 'cancelled', 'failed'];
const PAYOUT_STATUS = ['pending', 'approved', 'processing', 'paid', 'failed', 'cancelled'];
const INVOICE_STATUS = ['draft', 'issued', 'paid', 'overdue', 'cancelled'];

export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.sequelize.transaction(async (transaction) => {
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
        onDelete: 'RESTRICT'
      },
      buyer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      provider_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      service_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Services', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
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
        type: Sequelize.ENUM(...PAYMENT_STATUS),
        allowNull: false,
        defaultValue: 'pending'
      },
      gateway_reference: {
        type: Sequelize.STRING(128),
        allowNull: true
      },
      fingerprint: {
        type: Sequelize.STRING(128),
        allowNull: true
      },
      metadata_schema_version: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 1
      },
      metadata_encryption_key_id: {
        type: Sequelize.STRING(64),
        allowNull: true
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
      retention_expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_by: {
        type: Sequelize.STRING(120),
        allowNull: true
      },
      updated_by: {
        type: Sequelize.STRING(120),
        allowNull: true
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      deleted_by: {
        type: Sequelize.STRING(120),
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
    }, { transaction });

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
        onDelete: 'RESTRICT'
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
        type: Sequelize.ENUM(...PAYOUT_STATUS),
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
      metadata_schema_version: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 1
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
      retention_expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_by: {
        type: Sequelize.STRING(120),
        allowNull: true
      },
      updated_by: {
        type: Sequelize.STRING(120),
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
    }, { transaction });

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
        onDelete: 'RESTRICT'
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
        type: Sequelize.ENUM(...INVOICE_STATUS),
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
      metadata_schema_version: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 1
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
      retention_expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_by: {
        type: Sequelize.STRING(120),
        allowNull: true
      },
      updated_by: {
        type: Sequelize.STRING(120),
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
    }, { transaction });

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
      payload_digest: {
        type: Sequelize.STRING(128),
        allowNull: false
      },
      payload: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM(...FINANCE_WEBHOOK_STATUS),
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
      last_error_code: {
        type: Sequelize.STRING(48),
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
      retention_expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_by: {
        type: Sequelize.STRING(120),
        allowNull: true
      },
      updated_by: {
        type: Sequelize.STRING(120),
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
    }, { transaction });

    await queryInterface.createTable('finance_webhook_event_attempts', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      event_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'finance_webhook_events', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      attempt_number: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('queued', 'delivered', 'failed'),
        allowNull: false,
        defaultValue: 'queued'
      },
      response_code: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      duration_ms: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      payload_excerpt: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      error: {
        type: Sequelize.TEXT,
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
    }, { transaction });

    await queryInterface.addColumn('finance_transaction_histories', 'payment_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'payments', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    }, { transaction });

    await queryInterface.addColumn('finance_transaction_histories', 'payout_request_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'payout_requests', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    }, { transaction });

    await queryInterface.addColumn('finance_transaction_histories', 'invoice_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'finance_invoices', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    }, { transaction });

    await queryInterface.addColumn('finance_transaction_histories', 'retention_expires_at', {
      type: Sequelize.DATE,
      allowNull: true
    }, { transaction });

    await queryInterface.addColumn('finance_transaction_histories', 'created_by', {
      type: Sequelize.STRING(120),
      allowNull: true
    }, { transaction });

    await queryInterface.addColumn('finance_transaction_histories', 'updated_by', {
      type: Sequelize.STRING(120),
      allowNull: true
    }, { transaction });

    await queryInterface.addIndex('payments', ['order_id'], { transaction });
    await queryInterface.addIndex('payments', ['provider_id'], { transaction });
    await queryInterface.addIndex('payments', ['status'], { transaction });
    await queryInterface.addIndex('payout_requests', ['provider_id', 'status'], { transaction });
    await queryInterface.addIndex('finance_invoices', ['order_id'], { transaction });
    await queryInterface.addIndex('finance_webhook_events', ['status', 'next_retry_at'], { transaction });
    await queryInterface.addIndex('finance_webhook_event_attempts', ['event_id', 'attempt_number'], {
      unique: true,
      name: 'finance_webhook_event_attempts_unique_attempt',
      transaction
    });

    await queryInterface.addIndex('payments', ['fingerprint'], {
      unique: true,
      name: 'payments_fingerprint_unique',
      where: {
        fingerprint: { [Sequelize.Op.ne]: null }
      },
      transaction
    });

    await queryInterface.addIndex('payments', ['gateway_reference'], {
      unique: true,
      name: 'payments_gateway_reference_unique',
      where: {
        gateway_reference: { [Sequelize.Op.ne]: null }
      },
      transaction
    });

    await queryInterface.addIndex('finance_webhook_events', ['provider', 'event_type', 'payload_digest'], {
      unique: true,
      name: 'finance_webhook_event_payload_unique',
      transaction
    });

    await queryInterface.sequelize.query(
      'ALTER TABLE "payments" ADD CONSTRAINT payments_amount_positive CHECK (amount > 0)',
      { transaction }
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE \"payments\" ADD CONSTRAINT payments_currency_format CHECK (char_length(currency) = 3 AND currency = upper(currency))",
      { transaction }
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "payout_requests" ADD CONSTRAINT payout_requests_amount_positive CHECK (amount > 0)',
      { transaction }
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE \"payout_requests\" ADD CONSTRAINT payout_requests_currency_format CHECK (char_length(currency) = 3 AND currency = upper(currency))",
      { transaction }
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "finance_invoices" ADD CONSTRAINT finance_invoices_amount_positive CHECK (amount_due >= 0 AND amount_paid >= 0)',
      { transaction }
    );

    const now = new Date();
    await queryInterface.bulkInsert('finance_transaction_histories', [
      {
        id: deterministicId('finance_transaction_histories:migration-bootstrap'),
        event_type: 'migration.bootstrap',
        occurred_at: now,
        snapshot: {
          note: 'Payments orchestration tables initialised',
          version: '2025-03-25'
        },
        retention_expires_at: null,
        created_at: now,
        updated_at: now
      }
    ], { transaction });
  });
}

export async function down({ context: queryInterface, Sequelize }) {
  await queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.removeIndex('finance_webhook_events', 'finance_webhook_event_payload_unique', { transaction });
    await queryInterface.removeIndex('payments', 'payments_gateway_reference_unique', { transaction });
    await queryInterface.removeIndex('payments', 'payments_fingerprint_unique', { transaction });
    await queryInterface.removeIndex('finance_webhook_event_attempts', 'finance_webhook_event_attempts_unique_attempt', { transaction });
    await queryInterface.removeIndex('finance_webhook_events', ['status', 'next_retry_at'], { transaction });
    await queryInterface.removeIndex('finance_invoices', ['order_id'], { transaction });
    await queryInterface.removeIndex('payout_requests', ['provider_id', 'status'], { transaction });
    await queryInterface.removeIndex('payments', ['status'], { transaction });
    await queryInterface.removeIndex('payments', ['provider_id'], { transaction });
    await queryInterface.removeIndex('payments', ['order_id'], { transaction });

    await queryInterface.sequelize.query('ALTER TABLE "finance_invoices" DROP CONSTRAINT IF EXISTS finance_invoices_amount_positive', { transaction });
    await queryInterface.sequelize.query('ALTER TABLE "payout_requests" DROP CONSTRAINT IF EXISTS payout_requests_currency_format', { transaction });
    await queryInterface.sequelize.query('ALTER TABLE "payout_requests" DROP CONSTRAINT IF EXISTS payout_requests_amount_positive', { transaction });
    await queryInterface.sequelize.query('ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS payments_currency_format', { transaction });
    await queryInterface.sequelize.query('ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS payments_amount_positive', { transaction });

    await queryInterface.removeColumn('finance_transaction_histories', 'updated_by', { transaction });
    await queryInterface.removeColumn('finance_transaction_histories', 'created_by', { transaction });
    await queryInterface.removeColumn('finance_transaction_histories', 'retention_expires_at', { transaction });
    await queryInterface.removeColumn('finance_transaction_histories', 'invoice_id', { transaction });
    await queryInterface.removeColumn('finance_transaction_histories', 'payout_request_id', { transaction });
    await queryInterface.removeColumn('finance_transaction_histories', 'payment_id', { transaction });

    await queryInterface.dropTable('finance_webhook_event_attempts', { transaction });
    await queryInterface.dropTable('finance_webhook_events', { transaction });
    await queryInterface.dropTable('finance_invoices', { transaction });
    await queryInterface.dropTable('payout_requests', { transaction });
    await queryInterface.dropTable('payments', { transaction });

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_finance_webhook_event_attempts_status"', { transaction });
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_finance_webhook_events_status"', { transaction });
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_finance_invoices_status"', { transaction });
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_payout_requests_status"', { transaction });
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_payments_status"', { transaction });
  });
}
