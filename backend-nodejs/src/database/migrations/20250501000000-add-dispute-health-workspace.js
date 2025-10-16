export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('dispute_health_buckets', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    label: {
      type: Sequelize.STRING(120),
      allowNull: false
    },
    cadence: {
      type: Sequelize.STRING(120),
      allowNull: false
    },
    window_duration_hours: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 24
    },
    owner_name: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    owner_role: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    escalation_contact: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    playbook_url: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    hero_image_url: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    checklist: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    status: {
      type: Sequelize.ENUM('on_track', 'monitor', 'at_risk'),
      allowNull: false,
      defaultValue: 'on_track'
    },
    sort_order: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    created_by: {
      type: Sequelize.UUID,
      allowNull: true
    },
    updated_by: {
      type: Sequelize.UUID,
      allowNull: true
    },
    archived_at: {
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

  await queryInterface.createTable('dispute_health_entries', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    bucket_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'dispute_health_buckets', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    period_start: {
      type: Sequelize.DATE,
      allowNull: false
    },
    period_end: {
      type: Sequelize.DATE,
      allowNull: false
    },
    escalated_count: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    resolved_count: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    reopened_count: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    backlog_count: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    owner_notes: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    attachments: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
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

  await queryInterface.addIndex('dispute_health_entries', ['bucket_id', 'period_end']);
  await queryInterface.addConstraint('dispute_health_entries', {
    type: 'unique',
    fields: ['bucket_id', 'period_start', 'period_end'],
    name: 'dispute_health_entries_bucket_period_unique'
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeConstraint(
    'dispute_health_entries',
    'dispute_health_entries_bucket_period_unique'
  );
  await queryInterface.removeIndex('dispute_health_entries', ['bucket_id', 'period_end']);
  await queryInterface.dropTable('dispute_health_entries');
  await queryInterface.dropTable('dispute_health_buckets');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_dispute_health_buckets_status"');
}
