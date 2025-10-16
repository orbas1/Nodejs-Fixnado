const ESCALATION_TRIGGER_ENUM = 'enum_CommunicationsEscalationRule_trigger_type';
const ESCALATION_TARGET_ENUM = 'enum_CommunicationsEscalationRule_target_type';

export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('CommunicationsInboxConfiguration', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    tenant_id: {
      type: Sequelize.STRING(128),
      allowNull: false,
      unique: true
    },
    live_routing_enabled: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    default_greeting: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    ai_assist_display_name: {
      type: Sequelize.STRING(120),
      allowNull: false,
      defaultValue: 'Fixnado Assist'
    },
    ai_assist_description: {
      type: Sequelize.STRING(240),
      allowNull: true
    },
    timezone: {
      type: Sequelize.STRING(64),
      allowNull: false,
      defaultValue: 'Europe/London'
    },
    quiet_hours_start: {
      type: Sequelize.STRING(5),
      allowNull: true
    },
    quiet_hours_end: {
      type: Sequelize.STRING(5),
      allowNull: true
    },
    updated_by: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    created_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    },
    updated_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    }
  });

  await queryInterface.createTable('CommunicationsEntryPoint', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    configuration_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'CommunicationsInboxConfiguration',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    key: {
      type: Sequelize.STRING(64),
      allowNull: false
    },
    label: {
      type: Sequelize.STRING(120),
      allowNull: false
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    default_message: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    icon: {
      type: Sequelize.STRING(16),
      allowNull: true
    },
    image_url: {
      type: Sequelize.STRING(512),
      allowNull: true
    },
    enabled: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    display_order: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    cta_label: {
      type: Sequelize.STRING(80),
      allowNull: true
    },
    cta_url: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    updated_by: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    created_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    },
    updated_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    }
  });

  await queryInterface.addIndex('CommunicationsEntryPoint', ['configuration_id', 'key'], {
    unique: true,
    name: 'communications_entry_point_unique_key'
  });

  await queryInterface.createTable('CommunicationsQuickReply', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    configuration_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'CommunicationsInboxConfiguration',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    title: {
      type: Sequelize.STRING(120),
      allowNull: false
    },
    body: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    category: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    sort_order: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    allowed_roles: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: []
    },
    created_by: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    updated_by: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    created_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    },
    updated_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    }
  });

  await queryInterface.addIndex('CommunicationsQuickReply', ['configuration_id', 'sort_order'], {
    name: 'communications_quick_reply_sort'
  });

  await queryInterface.createTable('CommunicationsEscalationRule', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    configuration_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'CommunicationsInboxConfiguration',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    name: {
      type: Sequelize.STRING(120),
      allowNull: false
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    trigger_type: {
      type: Sequelize.ENUM('keyword', 'inactivity', 'sentiment', 'manual'),
      allowNull: false,
      defaultValue: 'keyword'
    },
    trigger_metadata: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {}
    },
    target_type: {
      type: Sequelize.ENUM('user', 'team', 'email', 'webhook'),
      allowNull: false,
      defaultValue: 'user'
    },
    target_reference: {
      type: Sequelize.STRING(160),
      allowNull: false
    },
    target_label: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    active: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    sla_minutes: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 15
    },
    allowed_roles: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: []
    },
    response_template: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    updated_by: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    created_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    },
    updated_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    }
  });

  await queryInterface.addIndex('CommunicationsEscalationRule', ['configuration_id', 'active'], {
    name: 'communications_escalation_active'
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('CommunicationsEscalationRule');
  await queryInterface.dropTable('CommunicationsQuickReply');
  await queryInterface.dropTable('CommunicationsEntryPoint');
  await queryInterface.dropTable('CommunicationsInboxConfiguration');

  if (queryInterface.sequelize.getDialect() === 'postgres') {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${ESCALATION_TRIGGER_ENUM}" CASCADE;`);
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${ESCALATION_TARGET_ENUM}" CASCADE;`);
  }
}
