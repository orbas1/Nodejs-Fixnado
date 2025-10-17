export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('ProviderEscrowPolicy', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    provider_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'User',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    company_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Company',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    name: {
      type: Sequelize.STRING(160),
      allowNull: false
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    auto_release_days: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    requires_dual_approval: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    max_amount: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true
    },
    notify_roles: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    document_checklist: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    release_conditions: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    created_by: {
      type: Sequelize.UUID,
      allowNull: true
    },
    updated_by: {
      type: Sequelize.UUID,
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

  await Promise.all([
    queryInterface.addIndex('ProviderEscrowPolicy', ['provider_id'], {
      name: 'provider_escrow_policy_provider_idx'
    }),
    queryInterface.addIndex('ProviderEscrowPolicy', ['company_id'], {
      name: 'provider_escrow_policy_company_idx'
    })
  ]);
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('ProviderEscrowPolicy');
}

