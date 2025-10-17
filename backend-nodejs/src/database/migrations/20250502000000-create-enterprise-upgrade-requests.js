export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('enterprise_upgrade_requests', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    company_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'companies', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    status: {
      type: Sequelize.ENUM('draft', 'submitted', 'in_review', 'approved', 'rejected', 'deferred'),
      allowNull: false,
      defaultValue: 'draft'
    },
    summary: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    requested_by: {
      type: Sequelize.UUID,
      allowNull: true
    },
    requested_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    target_go_live: {
      type: Sequelize.DATE,
      allowNull: true
    },
    seats: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    contract_value: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true
    },
    currency: {
      type: Sequelize.STRING(3),
      allowNull: false,
      defaultValue: 'GBP'
    },
    automation_scope: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    enterprise_features: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    onboarding_manager: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    notes: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    last_decision_at: {
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

  await queryInterface.addIndex('enterprise_upgrade_requests', ['company_id']);
  await queryInterface.addIndex('enterprise_upgrade_requests', ['status']);

  await queryInterface.createTable('enterprise_upgrade_contacts', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    upgrade_request_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'enterprise_upgrade_requests', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    name: {
      type: Sequelize.STRING(160),
      allowNull: false
    },
    role: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    email: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    phone: {
      type: Sequelize.STRING(48),
      allowNull: true
    },
    influence_level: {
      type: Sequelize.STRING(60),
      allowNull: true
    },
    primary_contact: {
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

  await queryInterface.addIndex('enterprise_upgrade_contacts', ['upgrade_request_id']);
  await queryInterface.addIndex('enterprise_upgrade_contacts', ['email']);

  await queryInterface.createTable('enterprise_upgrade_sites', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    upgrade_request_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'enterprise_upgrade_requests', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    site_name: {
      type: Sequelize.STRING(160),
      allowNull: false
    },
    region: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    headcount: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    go_live_date: {
      type: Sequelize.DATE,
      allowNull: true
    },
    image_url: {
      type: Sequelize.STRING(512),
      allowNull: true
    },
    notes: {
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

  await queryInterface.addIndex('enterprise_upgrade_sites', ['upgrade_request_id']);
  await queryInterface.addIndex('enterprise_upgrade_sites', ['region']);

  await queryInterface.createTable('enterprise_upgrade_checklist_items', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    upgrade_request_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'enterprise_upgrade_requests', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    label: {
      type: Sequelize.STRING(180),
      allowNull: false
    },
    status: {
      type: Sequelize.ENUM('not_started', 'in_progress', 'blocked', 'complete'),
      allowNull: false,
      defaultValue: 'not_started'
    },
    owner: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    due_date: {
      type: Sequelize.DATE,
      allowNull: true
    },
    notes: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    sort_order: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
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

  await queryInterface.addIndex('enterprise_upgrade_checklist_items', ['upgrade_request_id']);
  await queryInterface.addIndex('enterprise_upgrade_checklist_items', ['status']);

  await queryInterface.createTable('enterprise_upgrade_documents', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    upgrade_request_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'enterprise_upgrade_requests', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    title: {
      type: Sequelize.STRING(180),
      allowNull: false
    },
    type: {
      type: Sequelize.STRING(60),
      allowNull: true
    },
    url: {
      type: Sequelize.STRING(512),
      allowNull: false
    },
    thumbnail_url: {
      type: Sequelize.STRING(512),
      allowNull: true
    },
    description: {
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

  await queryInterface.addIndex('enterprise_upgrade_documents', ['upgrade_request_id']);
  await queryInterface.addIndex('enterprise_upgrade_documents', ['type']);
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('enterprise_upgrade_documents');
  await queryInterface.dropTable('enterprise_upgrade_checklist_items');
  await queryInterface.sequelize.query(
    'DROP TYPE IF EXISTS "enum_enterprise_upgrade_checklist_items_status"'
  );
  await queryInterface.dropTable('enterprise_upgrade_sites');
  await queryInterface.dropTable('enterprise_upgrade_contacts');
  await queryInterface.dropTable('enterprise_upgrade_requests');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_enterprise_upgrade_requests_status"');
}
