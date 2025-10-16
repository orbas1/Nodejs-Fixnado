export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('serviceman_dispute_cases', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    serviceman_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'User',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    dispute_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'disputes',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    case_number: {
      type: Sequelize.STRING(32),
      allowNull: false
    },
    title_encrypted: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    category: {
      type: Sequelize.ENUM('billing', 'service_quality', 'damage', 'timeline', 'compliance', 'other'),
      allowNull: false,
      defaultValue: 'billing'
    },
    status: {
      type: Sequelize.ENUM('draft', 'open', 'under_review', 'awaiting_customer', 'resolved', 'closed'),
      allowNull: false,
      defaultValue: 'draft'
    },
    severity: {
      type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'medium'
    },
    summary_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    next_step_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    assigned_team_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    assigned_owner_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    resolution_notes_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    external_reference_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    amount_disputed: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true
    },
    currency: {
      type: Sequelize.STRING(12),
      allowNull: false,
      defaultValue: 'GBP'
    },
    opened_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    due_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    resolved_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    sla_due_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    requires_follow_up: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    last_reviewed_at: {
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

  await queryInterface.addIndex('serviceman_dispute_cases', ['serviceman_id'], {
    name: 'serviceman_dispute_cases_serviceman_idx'
  });
  await queryInterface.addIndex('serviceman_dispute_cases', ['case_number'], {
    unique: true,
    name: 'serviceman_dispute_cases_case_number_unique'
  });
  await queryInterface.addIndex('serviceman_dispute_cases', ['status'], {
    name: 'serviceman_dispute_cases_status_idx'
  });

  await queryInterface.createTable('serviceman_dispute_tasks', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    dispute_case_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'serviceman_dispute_cases',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    label_encrypted: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    status: {
      type: Sequelize.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    due_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    assigned_to_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    instructions_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    completed_at: {
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

  await queryInterface.addIndex('serviceman_dispute_tasks', ['dispute_case_id'], {
    name: 'serviceman_dispute_tasks_case_idx'
  });

  await queryInterface.createTable('serviceman_dispute_notes', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    dispute_case_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'serviceman_dispute_cases',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    author_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'User',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    note_type: {
      type: Sequelize.ENUM('update', 'call', 'decision', 'escalation', 'reminder', 'other'),
      allowNull: false,
      defaultValue: 'update'
    },
    visibility: {
      type: Sequelize.ENUM('customer', 'internal', 'provider', 'finance', 'compliance'),
      allowNull: false,
      defaultValue: 'internal'
    },
    body_encrypted: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    next_steps_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
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

  await queryInterface.addIndex('serviceman_dispute_notes', ['dispute_case_id'], {
    name: 'serviceman_dispute_notes_case_idx'
  });
  await queryInterface.addIndex('serviceman_dispute_notes', ['author_id'], {
    name: 'serviceman_dispute_notes_author_idx'
  });

  await queryInterface.createTable('serviceman_dispute_evidence', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    dispute_case_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'serviceman_dispute_cases',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    uploaded_by: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'User',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    label_encrypted: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    file_url_encrypted: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    file_type_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    thumbnail_url_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    notes_encrypted: {
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

  await queryInterface.addIndex('serviceman_dispute_evidence', ['dispute_case_id'], {
    name: 'serviceman_dispute_evidence_case_idx'
  });
  await queryInterface.addIndex('serviceman_dispute_evidence', ['uploaded_by'], {
    name: 'serviceman_dispute_evidence_uploader_idx'
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('serviceman_dispute_evidence');
  await queryInterface.dropTable('serviceman_dispute_notes');
  await queryInterface.dropTable('serviceman_dispute_tasks');
  await queryInterface.dropTable('serviceman_dispute_cases');

  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_serviceman_dispute_cases_category"');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_serviceman_dispute_cases_status"');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_serviceman_dispute_cases_severity"');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_serviceman_dispute_tasks_status"');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_serviceman_dispute_notes_note_type"');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_serviceman_dispute_notes_visibility"');
}

