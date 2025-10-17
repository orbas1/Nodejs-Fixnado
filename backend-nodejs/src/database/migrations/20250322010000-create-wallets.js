'use strict';

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('wallet_configurations', {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.UUID,
      defaultValue: Sequelize.literal('gen_random_uuid()')
    },
    name: {
      allowNull: false,
      type: Sequelize.STRING(120),
      unique: true
    },
    settings: {
      allowNull: false,
      type: Sequelize.JSONB,
      defaultValue: {}
    },
    created_by: {
      allowNull: true,
      type: Sequelize.UUID
    },
    updated_by: {
      allowNull: true,
      type: Sequelize.UUID
    },
    created_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  await queryInterface.createTable('wallet_accounts', {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.UUID,
      defaultValue: Sequelize.literal('gen_random_uuid()')
    },
    owner_type: {
      allowNull: false,
      type: Sequelize.STRING(32)
    },
    owner_id: {
      allowNull: false,
      type: Sequelize.UUID
    },
    user_id: {
      allowNull: true,
      type: Sequelize.UUID
    },
    company_id: {
      allowNull: true,
      type: Sequelize.UUID
    },
    display_name: {
      allowNull: false,
      type: Sequelize.STRING(160)
    },
    alias: {
      allowNull: true,
      type: Sequelize.STRING(80)
    },
    currency: {
      allowNull: false,
      type: Sequelize.STRING(3)
    },
    balance: {
      allowNull: false,
      type: Sequelize.DECIMAL(14, 2),
      defaultValue: '0.00'
    },
    hold_balance: {
      allowNull: false,
      type: Sequelize.DECIMAL(14, 2),
      defaultValue: '0.00'
    },
    status: {
      allowNull: false,
      type: Sequelize.ENUM('active', 'suspended', 'closed'),
      defaultValue: 'active'
    },
    metadata: {
      allowNull: false,
      type: Sequelize.JSONB,
      defaultValue: {}
    },
    autopayout_enabled: {
      allowNull: false,
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    autopayout_threshold: {
      allowNull: true,
      type: Sequelize.DECIMAL(14, 2)
    },
    autopayout_method_id: {
      allowNull: true,
      type: Sequelize.UUID
    },
    spending_limit: {
      allowNull: true,
      type: Sequelize.DECIMAL(14, 2)
    },
    last_reconciled_at: {
      allowNull: true,
      type: Sequelize.DATE
    },
    created_by: {
      allowNull: true,
      type: Sequelize.UUID
    },
    updated_by: {
      allowNull: true,
      type: Sequelize.UUID
    },
    created_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  await queryInterface.createTable('wallet_payment_methods', {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.UUID,
      defaultValue: Sequelize.literal('gen_random_uuid()')
    },
    wallet_account_id: {
      allowNull: false,
      type: Sequelize.UUID,
      references: {
        model: 'wallet_accounts',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    label: {
      allowNull: false,
      type: Sequelize.STRING(120)
    },
    type: {
      allowNull: false,
      type: Sequelize.ENUM('bank_account', 'card', 'external_wallet')
    },
    status: {
      allowNull: false,
      type: Sequelize.ENUM('active', 'inactive', 'pending', 'rejected'),
      defaultValue: 'active'
    },
    masked_identifier: {
      allowNull: true,
      type: Sequelize.STRING(64)
    },
    details: {
      allowNull: false,
      type: Sequelize.JSONB,
      defaultValue: {}
    },
    supporting_document_url: {
      allowNull: true,
      type: Sequelize.TEXT
    },
    is_default_payout: {
      allowNull: false,
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    created_by: {
      allowNull: true,
      type: Sequelize.UUID
    },
    actor_role: {
      allowNull: true,
      type: Sequelize.STRING(32)
    },
    created_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  await queryInterface.createTable('wallet_transactions', {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.UUID,
      defaultValue: Sequelize.literal('gen_random_uuid()')
    },
    wallet_account_id: {
      allowNull: false,
      type: Sequelize.UUID,
      references: {
        model: 'wallet_accounts',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    type: {
      allowNull: false,
      type: Sequelize.ENUM('credit', 'debit', 'hold', 'release', 'refund', 'adjustment')
    },
    amount: {
      allowNull: false,
      type: Sequelize.DECIMAL(14, 2)
    },
    currency: {
      allowNull: false,
      type: Sequelize.STRING(3)
    },
    reference_type: {
      allowNull: true,
      type: Sequelize.STRING(64)
    },
    reference_id: {
      allowNull: true,
      type: Sequelize.STRING(128)
    },
    description: {
      allowNull: true,
      type: Sequelize.STRING(255)
    },
    actor_id: {
      allowNull: true,
      type: Sequelize.UUID
    },
    actor_role: {
      allowNull: true,
      type: Sequelize.STRING(32)
    },
    balance_before: {
      allowNull: false,
      type: Sequelize.DECIMAL(14, 2)
    },
    balance_after: {
      allowNull: false,
      type: Sequelize.DECIMAL(14, 2)
    },
    pending_before: {
      allowNull: false,
      type: Sequelize.DECIMAL(14, 2)
    },
    pending_after: {
      allowNull: false,
      type: Sequelize.DECIMAL(14, 2)
    },
    running_balance: {
      allowNull: true,
      type: Sequelize.DECIMAL(14, 2)
    },
    metadata: {
      allowNull: false,
      type: Sequelize.JSONB,
      defaultValue: {}
    },
    occurred_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    created_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  await queryInterface.addIndex('wallet_accounts', ['owner_id', 'owner_type']);
  await queryInterface.addIndex('wallet_accounts', ['user_id']);
  await queryInterface.addIndex('wallet_accounts', ['company_id']);
  await queryInterface.addIndex('wallet_accounts', ['status']);
  await queryInterface.addIndex('wallet_accounts', ['currency']);
  await queryInterface.addIndex('wallet_payment_methods', ['wallet_account_id']);
  await queryInterface.addIndex('wallet_payment_methods', ['status']);
  await queryInterface.addIndex('wallet_transactions', ['wallet_account_id']);
  await queryInterface.addIndex('wallet_transactions', ['wallet_account_id', 'occurred_at']);
  await queryInterface.addIndex('wallet_transactions', ['type']);

  await queryInterface.addConstraint('wallet_accounts', {
    fields: ['autopayout_method_id'],
    type: 'foreign key',
    name: 'wallet_accounts_autopayout_method_id_fkey',
    references: {
      table: 'wallet_payment_methods',
      field: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeConstraint('wallet_accounts', 'wallet_accounts_autopayout_method_id_fkey');
  await queryInterface.dropTable('wallet_transactions');
  await queryInterface.dropTable('wallet_payment_methods');
  await queryInterface.dropTable('wallet_accounts');
  await queryInterface.dropTable('wallet_configurations');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_wallet_accounts_status"');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_wallet_payment_methods_type"');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_wallet_payment_methods_status"');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_wallet_transactions_type"');
}
