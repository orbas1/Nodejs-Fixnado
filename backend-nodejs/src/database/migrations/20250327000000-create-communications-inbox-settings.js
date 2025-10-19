const ESCALATION_TRIGGER_ENUM = 'enum_CommunicationsEscalationRule_trigger_type';
const ESCALATION_TARGET_ENUM = 'enum_CommunicationsEscalationRule_target_type';
const ALLOWED_ROLES = [
  'user',
  'serviceman',
  'provider',
  'crew',
  'enterprise',
  'moderator',
  'support',
  'admin'
];

export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.createTable('CommunicationsInboxConfiguration', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      tenant_id: {
        type: Sequelize.STRING(128),
        allowNull: false
      },
      region_code: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'global'
      },
      environment_key: {
        type: Sequelize.STRING(32),
        allowNull: true
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
      retention_expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      updated_by: {
        type: Sequelize.STRING(120),
        allowNull: true
      },
      created_by: {
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
    }, { transaction });

    await queryInterface.addIndex('CommunicationsInboxConfiguration', ['tenant_id', 'region_code'], {
      unique: true,
      name: 'communications_configuration_tenant_region_unique',
      transaction
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
      retention_expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      updated_by: {
        type: Sequelize.STRING(120),
        allowNull: true
      },
      created_by: {
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
    }, { transaction });

    await queryInterface.addIndex('CommunicationsEntryPoint', ['configuration_id', 'key'], {
      unique: true,
      name: 'communications_entry_point_unique_key',
      transaction
    });

    await queryInterface.sequelize.query(
      'CREATE INDEX communications_entry_point_enabled_idx ON "CommunicationsEntryPoint" (configuration_id) WHERE enabled = true',
      { transaction }
    );

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
        type: Sequelize.JSONB,
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
      retention_expires_at: {
        type: Sequelize.DATE,
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
    }, { transaction });

    await queryInterface.addIndex('CommunicationsQuickReply', ['configuration_id', 'sort_order'], {
      name: 'communications_quick_reply_sort',
      transaction
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
        type: Sequelize.JSONB,
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
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      response_template: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_by: {
        type: Sequelize.STRING(120),
        allowNull: true
      },
      updated_by: {
        type: Sequelize.STRING(120),
        allowNull: true
      },
      retention_expires_at: {
        type: Sequelize.DATE,
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
    }, { transaction });

    await queryInterface.addIndex('CommunicationsEscalationRule', ['configuration_id', 'active'], {
      name: 'communications_escalation_active',
      transaction
    });

    if (queryInterface.sequelize.getDialect() === 'postgres') {
      const allowedRolesList = ALLOWED_ROLES.map((role) => `'${role}'`).join(',');
      await queryInterface.sequelize.query(
        `ALTER TABLE "CommunicationsQuickReply"
          ADD CONSTRAINT communications_quick_reply_roles_valid
          CHECK (jsonb_typeof(allowed_roles) = 'array' AND NOT EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(allowed_roles) AS role
            WHERE role NOT IN (${allowedRolesList})
          ))`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "CommunicationsEscalationRule"
          ADD CONSTRAINT communications_escalation_roles_valid
          CHECK (jsonb_typeof(allowed_roles) = 'array' AND NOT EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(allowed_roles) AS role
            WHERE role NOT IN (${allowedRolesList})
          ))`,
        { transaction }
      );
    }
  });
}

export async function down({ context: queryInterface, Sequelize }) {
  await queryInterface.sequelize.transaction(async (transaction) => {
    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query(
        'ALTER TABLE "CommunicationsEscalationRule" DROP CONSTRAINT IF EXISTS communications_escalation_roles_valid',
        { transaction }
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "CommunicationsQuickReply" DROP CONSTRAINT IF EXISTS communications_quick_reply_roles_valid',
        { transaction }
      );
      await queryInterface.sequelize.query(
        'DROP INDEX IF EXISTS communications_entry_point_enabled_idx',
        { transaction }
      );
    }

    await queryInterface.removeIndex('CommunicationsEscalationRule', 'communications_escalation_active', { transaction });
    await queryInterface.removeIndex('CommunicationsQuickReply', 'communications_quick_reply_sort', { transaction });
    await queryInterface.removeIndex('CommunicationsEntryPoint', 'communications_entry_point_unique_key', { transaction });
    await queryInterface.removeIndex('CommunicationsInboxConfiguration', 'communications_configuration_tenant_region_unique', { transaction });

    await queryInterface.dropTable('CommunicationsEscalationRule', { transaction });
    await queryInterface.dropTable('CommunicationsQuickReply', { transaction });
    await queryInterface.dropTable('CommunicationsEntryPoint', { transaction });
    await queryInterface.dropTable('CommunicationsInboxConfiguration', { transaction });

    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${ESCALATION_TRIGGER_ENUM}" CASCADE;`, { transaction });
      await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${ESCALATION_TARGET_ENUM}" CASCADE;`, { transaction });
    }
  });
}
