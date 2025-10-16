export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('ComplianceControl', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    company_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Company', key: 'id' },
      onDelete: 'SET NULL'
    },
    owner_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      onDelete: 'SET NULL'
    },
    owner_team: {
      type: Sequelize.STRING(120),
      allowNull: false,
      defaultValue: 'Compliance Ops'
    },
    title: {
      type: Sequelize.STRING(160),
      allowNull: false
    },
    category: {
      type: Sequelize.ENUM('policy', 'procedure', 'technical', 'vendor', 'training', 'other'),
      allowNull: false,
      defaultValue: 'policy'
    },
    control_type: {
      type: Sequelize.ENUM('preventative', 'detective', 'corrective', 'compensating'),
      allowNull: false,
      defaultValue: 'preventative'
    },
    status: {
      type: Sequelize.ENUM('draft', 'active', 'monitoring', 'overdue', 'retired'),
      allowNull: false,
      defaultValue: 'active'
    },
    review_frequency: {
      type: Sequelize.ENUM('monthly', 'quarterly', 'semiannual', 'annual', 'event_driven'),
      allowNull: false,
      defaultValue: 'annual'
    },
    next_review_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    last_review_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    owner_email: {
      type: Sequelize.STRING(180),
      allowNull: true
    },
    evidence_required: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    evidence_location: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    documentation_url: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    escalation_policy: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    notes: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    tags: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    watchers: {
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
      defaultValue: Sequelize.fn('NOW'),
      allowNull: false
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('NOW'),
      allowNull: false
    }
  });

  await queryInterface.addIndex('ComplianceControl', ['status', 'review_frequency'], {
    name: 'compliance_control_status_frequency'
  });
  await queryInterface.addIndex('ComplianceControl', ['next_review_at'], {
    name: 'compliance_control_next_review'
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeIndex('ComplianceControl', 'compliance_control_status_frequency');
  await queryInterface.removeIndex('ComplianceControl', 'compliance_control_next_review');
  await queryInterface.dropTable('ComplianceControl');
}
