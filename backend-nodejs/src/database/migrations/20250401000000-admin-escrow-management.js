export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.addColumn('Escrow', 'amount', {
    type: Sequelize.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  });

  await queryInterface.addColumn('Escrow', 'currency', {
    type: Sequelize.STRING(3),
    allowNull: false,
    defaultValue: 'GBP'
  });

  await queryInterface.addColumn('Escrow', 'external_reference', {
    type: Sequelize.STRING(120),
    allowNull: true
  });

  await queryInterface.addColumn('Escrow', 'policy_id', {
    type: Sequelize.STRING(120),
    allowNull: true
  });

  await queryInterface.addColumn('Escrow', 'requires_dual_approval', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  });

  await queryInterface.addColumn('Escrow', 'auto_release_at', {
    type: Sequelize.DATE,
    allowNull: true
  });

  await queryInterface.addColumn('Escrow', 'on_hold', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  });

  await queryInterface.addColumn('Escrow', 'hold_reason', {
    type: Sequelize.TEXT,
    allowNull: true
  });

  await queryInterface.addColumn('Escrow', 'metadata', {
    type: Sequelize.JSONB,
    allowNull: false,
    defaultValue: {}
  });

  await queryInterface.sequelize.query(
    "UPDATE \"Escrow\" SET metadata = '{}' WHERE metadata IS NULL"
  );

  await queryInterface.createTable('EscrowMilestone', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    escrow_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Escrow', key: 'id' },
      onDelete: 'CASCADE'
    },
    label: {
      type: Sequelize.STRING(160),
      allowNull: false
    },
    status: {
      type: Sequelize.ENUM('pending', 'submitted', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    },
    sequence: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    amount: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true
    },
    due_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    completed_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    evidence_url: {
      type: Sequelize.STRING(512),
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

  await queryInterface.createTable('EscrowNote', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    escrow_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Escrow', key: 'id' },
      onDelete: 'CASCADE'
    },
    author_id: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    body: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    pinned: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
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
}

export async function down({ context: queryInterface, Sequelize }) {
  await queryInterface.dropTable('EscrowNote');
  await queryInterface.dropTable('EscrowMilestone');

  await queryInterface.removeColumn('Escrow', 'metadata');
  await queryInterface.removeColumn('Escrow', 'hold_reason');
  await queryInterface.removeColumn('Escrow', 'on_hold');
  await queryInterface.removeColumn('Escrow', 'auto_release_at');
  await queryInterface.removeColumn('Escrow', 'requires_dual_approval');
  await queryInterface.removeColumn('Escrow', 'policy_id');
  await queryInterface.removeColumn('Escrow', 'external_reference');
  await queryInterface.removeColumn('Escrow', 'currency');
  await queryInterface.removeColumn('Escrow', 'amount');

  await queryInterface.sequelize.query(
    'DROP TYPE IF EXISTS "enum_EscrowMilestone_status";'
  );
}
