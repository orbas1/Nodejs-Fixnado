export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('ComplianceDocument', {
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
    uploaded_by: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      onDelete: 'SET NULL'
    },
    type: {
      type: Sequelize.STRING(64),
      allowNull: false
    },
    status: {
      type: Sequelize.ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected', 'expired'),
      allowNull: false,
      defaultValue: 'submitted'
    },
    storage_key: {
      type: Sequelize.STRING(255),
      allowNull: false
    },
    file_name: {
      type: Sequelize.STRING(180),
      allowNull: false
    },
    file_size_bytes: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    mime_type: {
      type: Sequelize.STRING(64),
      allowNull: false
    },
    checksum: {
      type: Sequelize.STRING(128),
      allowNull: true
    },
    issued_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    expiry_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    submitted_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    reviewed_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    reviewer_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      onDelete: 'SET NULL'
    },
    rejection_reason: {
      type: Sequelize.TEXT,
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

  await queryInterface.addIndex('ComplianceDocument', ['company_id', 'type'], {
    name: 'compliance_document_company_type'
  });

  await queryInterface.createTable('InsuredSellerApplication', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    company_id: {
      type: Sequelize.UUID,
      allowNull: false,
      unique: true,
      references: { model: 'Company', key: 'id' },
      onDelete: 'CASCADE'
    },
    status: {
      type: Sequelize.ENUM('not_started', 'pending_documents', 'in_review', 'approved', 'suspended'),
      allowNull: false,
      defaultValue: 'pending_documents'
    },
    required_documents: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: []
    },
    compliance_score: {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0
    },
    submitted_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    approved_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    expires_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    last_evaluated_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    badge_enabled: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    reviewer_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      onDelete: 'SET NULL'
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

  await queryInterface.createTable('MarketplaceModerationAction', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    entity_type: {
      type: Sequelize.STRING(32),
      allowNull: false
    },
    entity_id: {
      type: Sequelize.UUID,
      allowNull: false
    },
    action: {
      type: Sequelize.STRING(32),
      allowNull: false
    },
    actor_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      onDelete: 'SET NULL'
    },
    reason: {
      type: Sequelize.TEXT,
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
    }
  });

  await queryInterface.addIndex('MarketplaceModerationAction', ['entity_type', 'entity_id'], {
    name: 'marketplace_moderation_entity'
  });

  await queryInterface.addColumn('MarketplaceItem', 'status', {
    type: Sequelize.ENUM('draft', 'pending_review', 'approved', 'rejected', 'suspended'),
    allowNull: false,
    defaultValue: 'draft'
  });

  await queryInterface.addColumn('MarketplaceItem', 'insured_only', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  });

  await queryInterface.addColumn('MarketplaceItem', 'compliance_hold_until', {
    type: Sequelize.DATE,
    allowNull: true
  });

  await queryInterface.addColumn('MarketplaceItem', 'last_reviewed_at', {
    type: Sequelize.DATE,
    allowNull: true
  });

  await queryInterface.addColumn('MarketplaceItem', 'moderation_notes', {
    type: Sequelize.TEXT,
    allowNull: true
  });

  await queryInterface.addColumn('MarketplaceItem', 'compliance_snapshot', {
    type: Sequelize.JSON,
    allowNull: false,
    defaultValue: {}
  });

  await queryInterface.addColumn('Company', 'insured_seller_status', {
    type: Sequelize.ENUM('not_started', 'pending_documents', 'in_review', 'approved', 'suspended'),
    allowNull: false,
    defaultValue: 'not_started'
  });

  await queryInterface.addColumn('Company', 'insured_seller_expires_at', {
    type: Sequelize.DATE,
    allowNull: true
  });

  await queryInterface.addColumn('Company', 'insured_seller_badge_visible', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  });

  await queryInterface.addColumn('Company', 'compliance_score', {
    type: Sequelize.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0
  });
}

export async function down({ context: queryInterface, Sequelize }) {
  await queryInterface.removeColumn('Company', 'compliance_score');
  await queryInterface.removeColumn('Company', 'insured_seller_badge_visible');
  await queryInterface.removeColumn('Company', 'insured_seller_expires_at');
  await queryInterface.removeColumn('Company', 'insured_seller_status');

  await queryInterface.removeColumn('MarketplaceItem', 'compliance_snapshot');
  await queryInterface.removeColumn('MarketplaceItem', 'moderation_notes');
  await queryInterface.removeColumn('MarketplaceItem', 'last_reviewed_at');
  await queryInterface.removeColumn('MarketplaceItem', 'compliance_hold_until');
  await queryInterface.removeColumn('MarketplaceItem', 'insured_only');
  await queryInterface.removeColumn('MarketplaceItem', 'status');

  await queryInterface.dropTable('MarketplaceModerationAction');
  await queryInterface.dropTable('InsuredSellerApplication');
  await queryInterface.dropTable('ComplianceDocument');

  if (queryInterface.sequelize.getDialect() === 'postgres') {
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_ComplianceDocument_status\" CASCADE;");
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_InsuredSellerApplication_status\" CASCADE;");
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_MarketplaceItem_status\" CASCADE;");
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_Company_insured_seller_status\" CASCADE;");
  }
}
