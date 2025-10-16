import { randomUUID } from 'node:crypto';

export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('InboxQueue', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    name: {
      type: Sequelize.STRING(120),
      allowNull: false
    },
    slug: {
      type: Sequelize.STRING(140),
      allowNull: false,
      unique: true
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    sla_minutes: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 15
    },
    escalation_minutes: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 45
    },
    allowed_roles: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
      defaultValue: ['support']
    },
    auto_responder_enabled: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    triage_form_url: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    channels: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
      defaultValue: ['in-app']
    },
    accent_color: {
      type: Sequelize.STRING(9),
      allowNull: true
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    },
    updated_by: {
      type: Sequelize.STRING(120),
      allowNull: true
    }
  });

  await queryInterface.createTable('InboxConfiguration', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    auto_assign_enabled: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    default_queue_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'InboxQueue', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    quiet_hours_start: {
      type: Sequelize.STRING(5),
      allowNull: true
    },
    quiet_hours_end: {
      type: Sequelize.STRING(5),
      allowNull: true
    },
    attachments_enabled: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    max_attachment_mb: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 25
    },
    allowed_file_types: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
      defaultValue: ['jpg', 'png', 'pdf']
    },
    ai_assist_enabled: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    ai_assist_provider: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    first_response_sla_minutes: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 10
    },
    resolution_sla_minutes: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 120
    },
    escalation_policy: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: { levelOneMinutes: 15, levelTwoMinutes: 45 }
    },
    brand_color: {
      type: Sequelize.STRING(9),
      allowNull: true
    },
    signature: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    role_restrictions: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    updated_by: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    }
  });

  await queryInterface.createTable('InboxTemplate', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    queue_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'InboxQueue', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    name: {
      type: Sequelize.STRING(160),
      allowNull: false
    },
    category: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    locale: {
      type: Sequelize.STRING(12),
      allowNull: false,
      defaultValue: 'en-GB'
    },
    subject: {
      type: Sequelize.STRING(180),
      allowNull: true
    },
    body: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    tags: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
      defaultValue: []
    },
    preview_image_url: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    updated_by: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    }
  });

  await queryInterface.addColumn('Conversation', 'queue_id', {
    type: Sequelize.UUID,
    allowNull: true,
    references: { model: 'InboxQueue', key: 'id' },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  });

  await queryInterface.addIndex('Conversation', ['queue_id']);

  const defaultQueueId = randomUUID();
  await queryInterface.bulkInsert('InboxQueue', [
    {
      id: defaultQueueId,
      name: 'Support desk',
      slug: 'support-desk',
      description: 'Default queue for inbound Fixnado support conversations.',
      sla_minutes: 15,
      escalation_minutes: 45,
      allowed_roles: ['support', 'operations'],
      auto_responder_enabled: true,
      triage_form_url: null,
      channels: ['in-app', 'email'],
      accent_color: '#0ea5e9',
      created_at: new Date(),
      updated_at: new Date(),
      updated_by: 'system'
    }
  ]);

  const configurationId = randomUUID();
  await queryInterface.bulkInsert('InboxConfiguration', [
    {
      id: configurationId,
      auto_assign_enabled: true,
      default_queue_id: defaultQueueId,
      attachments_enabled: true,
      max_attachment_mb: 25,
      allowed_file_types: ['jpg', 'png', 'pdf'],
      ai_assist_enabled: true,
      ai_assist_provider: 'fixnado-assist',
      first_response_sla_minutes: 10,
      resolution_sla_minutes: 120,
      escalation_policy: { levelOneMinutes: 15, levelTwoMinutes: 45 },
      role_restrictions: [],
      created_at: new Date(),
      updated_at: new Date(),
      updated_by: 'system'
    }
  ]);
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeIndex('Conversation', ['queue_id']);
  await queryInterface.removeColumn('Conversation', 'queue_id');
  await queryInterface.dropTable('InboxTemplate');
  await queryInterface.dropTable('InboxConfiguration');
  await queryInterface.dropTable('InboxQueue');
}
