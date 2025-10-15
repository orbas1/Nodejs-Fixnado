import { randomUUID } from 'node:crypto';

export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('Region', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    code: {
      type: Sequelize.STRING(8),
      allowNull: false,
      unique: true
    },
    name: {
      type: Sequelize.STRING(120),
      allowNull: false
    },
    residency_tier: {
      type: Sequelize.ENUM('strict', 'standard', 'flex'),
      allowNull: false,
      defaultValue: 'standard'
    },
    data_residency_statement: {
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
  });

  await queryInterface.bulkInsert('Region', [
    {
      id: randomUUID(),
      code: 'GB',
      name: 'United Kingdom',
      residency_tier: 'strict',
      data_residency_statement: 'Primary region located in London with FCA aligned controls.',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: randomUUID(),
      code: 'IE',
      name: 'Ireland',
      residency_tier: 'standard',
      data_residency_statement: 'EU redundancy region operating within GDPR requirements.',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: randomUUID(),
      code: 'AE',
      name: 'United Arab Emirates',
      residency_tier: 'flex',
      data_residency_statement: 'Regional edge zone with privacy contract overlays.',
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);

  const tablesToAugment = [
    'User',
    'Company',
    'Order',
    'Escrow',
    'Dispute',
    'MarketplaceItem',
    'Conversation',
    'ConversationMessage',
    'MessageDelivery',
    'CampaignInvoice',
    'RentalAgreement'
  ];

  for (const tableName of tablesToAugment) {
    await queryInterface.addColumn(tableName, 'region_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Region', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
    await queryInterface.addIndex(tableName, ['region_id']);
  }

  const tablesNeedingDefaultRegion = [
    'User',
    'Company',
    'Order',
    'Escrow',
    'Dispute',
    'MarketplaceItem',
    'Conversation',
    'ConversationMessage',
    'MessageDelivery',
    'CampaignInvoice',
    'RentalAgreement'
  ];

  for (const tableName of tablesNeedingDefaultRegion) {
    await queryInterface.sequelize.query(
      `UPDATE "${tableName}" SET region_id = (SELECT id FROM "Region" WHERE code = 'GB') WHERE region_id IS NULL`
    );
  }

  await queryInterface.createTable('finance_transaction_histories', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    order_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Order', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    escrow_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Escrow', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    dispute_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Dispute', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    event_type: {
      type: Sequelize.STRING(64),
      allowNull: false
    },
    occurred_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    actor_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    snapshot: {
      type: Sequelize.JSONB,
      allowNull: false
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

  await queryInterface.addIndex('finance_transaction_histories', ['event_type', 'occurred_at']);
  await queryInterface.addIndex('finance_transaction_histories', ['order_id', 'occurred_at']);
  await queryInterface.addIndex('finance_transaction_histories', ['region_id', 'occurred_at']);

  await queryInterface.createTable('message_histories', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    message_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'ConversationMessage', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    version: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    snapshot: {
      type: Sequelize.JSONB,
      allowNull: false
    },
    region_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Region', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    captured_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    }
  });

  await queryInterface.addIndex('message_histories', ['message_id', 'version']);
  await queryInterface.addIndex('message_histories', ['region_id', 'captured_at']);

  await queryInterface.createTable('storefront_revision_logs', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    marketplace_item_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'MarketplaceItem', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    change_type: {
      type: Sequelize.STRING(64),
      allowNull: false
    },
    actor_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    snapshot: {
      type: Sequelize.JSONB,
      allowNull: false
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
    }
  });

  await queryInterface.addIndex('storefront_revision_logs', ['marketplace_item_id', 'created_at']);
  await queryInterface.addIndex('storefront_revision_logs', ['region_id', 'created_at']);

  await queryInterface.createTable('data_subject_requests', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    subject_email: {
      type: Sequelize.STRING(320),
      allowNull: false
    },
    request_type: {
      type: Sequelize.ENUM('access', 'erasure', 'rectification'),
      allowNull: false
    },
    status: {
      type: Sequelize.ENUM('received', 'in_progress', 'completed', 'rejected'),
      allowNull: false,
      defaultValue: 'received'
    },
    requested_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    processed_at: {
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
    payload_location: {
      type: Sequelize.STRING(512),
      allowNull: true
    },
    audit_log: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
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

  await queryInterface.addIndex('data_subject_requests', ['request_type', 'status']);
  await queryInterface.addIndex('data_subject_requests', ['subject_email', 'requested_at']);
}

export async function down({ context: queryInterface, Sequelize: _Sequelize }) {
  await queryInterface.removeIndex('data_subject_requests', ['subject_email', 'requested_at']);
  await queryInterface.removeIndex('data_subject_requests', ['request_type', 'status']);
  await queryInterface.dropTable('data_subject_requests');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_data_subject_requests_request_type"');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_data_subject_requests_status"');

  await queryInterface.removeIndex('storefront_revision_logs', ['region_id', 'created_at']);
  await queryInterface.removeIndex('storefront_revision_logs', ['marketplace_item_id', 'created_at']);
  await queryInterface.dropTable('storefront_revision_logs');

  await queryInterface.removeIndex('message_histories', ['region_id', 'captured_at']);
  await queryInterface.removeIndex('message_histories', ['message_id', 'version']);
  await queryInterface.dropTable('message_histories');

  await queryInterface.removeIndex('finance_transaction_histories', ['region_id', 'occurred_at']);
  await queryInterface.removeIndex('finance_transaction_histories', ['order_id', 'occurred_at']);
  await queryInterface.removeIndex('finance_transaction_histories', ['event_type', 'occurred_at']);
  await queryInterface.dropTable('finance_transaction_histories');

  const tablesToAugment = [
    'User',
    'Company',
    'Order',
    'Escrow',
    'Dispute',
    'MarketplaceItem',
    'Conversation',
    'ConversationMessage',
    'MessageDelivery',
    'CampaignInvoice',
    'RentalAgreement'
  ];

  for (const tableName of tablesToAugment) {
    await queryInterface.removeIndex(tableName, ['region_id']);
    await queryInterface.removeColumn(tableName, 'region_id');
  }

  await queryInterface.bulkDelete('Region', {});
  await queryInterface.dropTable('Region');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Region_residency_tier"');
}
