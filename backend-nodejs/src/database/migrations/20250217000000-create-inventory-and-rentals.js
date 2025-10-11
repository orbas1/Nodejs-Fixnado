export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('InventoryItem', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    company_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Company', key: 'id' },
      onDelete: 'CASCADE'
    },
    marketplace_item_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'MarketplaceItem', key: 'id' },
      onDelete: 'SET NULL'
    },
    name: {
      type: Sequelize.STRING(120),
      allowNull: false
    },
    sku: {
      type: Sequelize.STRING(64),
      allowNull: false
    },
    category: {
      type: Sequelize.STRING(64),
      allowNull: false
    },
    unit_type: {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: 'unit'
    },
    quantity_on_hand: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    quantity_reserved: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    safety_stock: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    location_zone_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'ServiceZone', key: 'id' },
      onDelete: 'SET NULL'
    },
    rental_rate: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true
    },
    rental_rate_currency: {
      type: Sequelize.STRING(3),
      allowNull: true
    },
    deposit_amount: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true
    },
    deposit_currency: {
      type: Sequelize.STRING(3),
      allowNull: true
    },
    replacement_cost: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true
    },
    insurance_required: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    condition_rating: {
      type: Sequelize.ENUM('new', 'excellent', 'good', 'fair', 'needs_service'),
      allowNull: false,
      defaultValue: 'good'
    },
    metadata: {
      type: Sequelize.JSON,
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

  await queryInterface.addIndex('InventoryItem', ['company_id', 'sku'], {
    unique: true,
    name: 'inventory_item_company_sku'
  });

  await queryInterface.addIndex('InventoryItem', ['company_id', 'category'], {
    name: 'inventory_item_company_category'
  });

  await queryInterface.createTable('InventoryLedgerEntry', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    item_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'InventoryItem', key: 'id' },
      onDelete: 'CASCADE'
    },
    type: {
      type: Sequelize.ENUM(
        'adjustment',
        'reservation',
        'reservation_release',
        'checkout',
        'return',
        'write_off',
        'restock'
      ),
      allowNull: false
    },
    quantity: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    balance_after: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    reference_id: {
      type: Sequelize.UUID,
      allowNull: true
    },
    reference_type: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    source: {
      type: Sequelize.ENUM('system', 'provider', 'automation'),
      allowNull: false,
      defaultValue: 'system'
    },
    note: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    metadata: {
      type: Sequelize.JSON,
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

  await queryInterface.addIndex('InventoryLedgerEntry', ['item_id', 'created_at'], {
    name: 'inventory_ledger_item_created_at'
  });

  await queryInterface.addIndex('InventoryLedgerEntry', ['reference_id', 'reference_type'], {
    name: 'inventory_ledger_reference'
  });

  await queryInterface.createTable('InventoryAlert', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    item_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'InventoryItem', key: 'id' },
      onDelete: 'CASCADE'
    },
    type: {
      type: Sequelize.ENUM('low_stock', 'overdue_return', 'damage_reported', 'manual'),
      allowNull: false
    },
    severity: {
      type: Sequelize.ENUM('info', 'warning', 'critical'),
      allowNull: false,
      defaultValue: 'warning'
    },
    status: {
      type: Sequelize.ENUM('active', 'acknowledged', 'resolved'),
      allowNull: false,
      defaultValue: 'active'
    },
    triggered_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    resolved_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    resolution_note: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    metadata: {
      type: Sequelize.JSON,
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

  await queryInterface.addIndex('InventoryAlert', ['item_id', 'status'], {
    name: 'inventory_alert_item_status'
  });

  await queryInterface.createTable('RentalAgreement', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    rental_number: {
      type: Sequelize.STRING(24),
      allowNull: false,
      unique: true
    },
    item_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'InventoryItem', key: 'id' },
      onDelete: 'CASCADE'
    },
    marketplace_item_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'MarketplaceItem', key: 'id' },
      onDelete: 'SET NULL'
    },
    company_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Company', key: 'id' },
      onDelete: 'CASCADE'
    },
    renter_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'User', key: 'id' },
      onDelete: 'CASCADE'
    },
    booking_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Booking', key: 'id' },
      onDelete: 'SET NULL'
    },
    status: {
      type: Sequelize.ENUM(
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
    deposit_status: {
      type: Sequelize.ENUM('pending', 'held', 'released', 'forfeited', 'partially_released'),
      allowNull: false,
      defaultValue: 'pending'
    },
    quantity: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    rental_start_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    rental_end_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    pickup_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    return_due_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    returned_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    deposit_amount: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true
    },
    deposit_currency: {
      type: Sequelize.STRING(3),
      allowNull: true
    },
    daily_rate: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true
    },
    rate_currency: {
      type: Sequelize.STRING(3),
      allowNull: true
    },
    condition_out: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {}
    },
    condition_in: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {}
    },
    meta: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {}
    },
    cancellation_reason: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    last_status_transition_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
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

  await queryInterface.addIndex('RentalAgreement', ['item_id', 'status'], {
    name: 'rental_agreement_item_status'
  });

  await queryInterface.addIndex('RentalAgreement', ['renter_id', 'status'], {
    name: 'rental_agreement_renter_status'
  });

  await queryInterface.createTable('RentalCheckpoint', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    rental_agreement_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'RentalAgreement', key: 'id' },
      onDelete: 'CASCADE'
    },
    type: {
      type: Sequelize.ENUM('note', 'status_change', 'handover', 'return', 'inspection', 'deposit'),
      allowNull: false
    },
    description: {
      type: Sequelize.STRING(255),
      allowNull: false
    },
    recorded_by: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'User', key: 'id' },
      onDelete: 'CASCADE'
    },
    recorded_by_role: {
      type: Sequelize.ENUM('provider', 'customer', 'system', 'admin'),
      allowNull: false
    },
    occurred_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    payload: {
      type: Sequelize.JSON,
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

  await queryInterface.addIndex('RentalCheckpoint', ['rental_agreement_id', 'occurred_at'], {
    name: 'rental_checkpoint_agreement_time'
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('RentalCheckpoint');
  await queryInterface.dropTable('RentalAgreement');
  await queryInterface.dropTable('InventoryAlert');
  await queryInterface.dropTable('InventoryLedgerEntry');
  await queryInterface.dropTable('InventoryItem');

  const enumNames = [
    'enum_InventoryItem_condition_rating',
    'enum_InventoryLedgerEntry_type',
    'enum_InventoryLedgerEntry_source',
    'enum_InventoryAlert_type',
    'enum_InventoryAlert_severity',
    'enum_InventoryAlert_status',
    'enum_RentalAgreement_status',
    'enum_RentalAgreement_deposit_status',
    'enum_RentalCheckpoint_type',
    'enum_RentalCheckpoint_recorded_by_role'
  ];

  for (const enumName of enumNames) {
    // eslint-disable-next-line no-await-in-loop
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}" CASCADE;`);
  }
}
