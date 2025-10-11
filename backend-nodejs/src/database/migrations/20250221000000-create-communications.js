export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('Conversation', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    subject: {
      type: Sequelize.STRING(160),
      allowNull: false
    },
    created_by_id: {
      type: Sequelize.UUID,
      allowNull: false
    },
    created_by_type: {
      type: Sequelize.ENUM('user', 'company', 'serviceman', 'admin', 'enterprise'),
      allowNull: false,
      defaultValue: 'user'
    },
    default_timezone: {
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
    ai_assist_default: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    retention_days: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 90
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

  await queryInterface.createTable('ConversationParticipant', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    conversation_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Conversation', key: 'id' },
      onDelete: 'CASCADE'
    },
    participant_type: {
      type: Sequelize.ENUM('user', 'company', 'serviceman', 'admin', 'enterprise', 'support_bot'),
      allowNull: false
    },
    participant_reference_id: {
      type: Sequelize.UUID,
      allowNull: true
    },
    display_name: {
      type: Sequelize.STRING(160),
      allowNull: false
    },
    role: {
      type: Sequelize.ENUM('customer', 'provider', 'support', 'finance', 'compliance', 'operations', 'guest', 'ai_assistant'),
      allowNull: false,
      defaultValue: 'customer'
    },
    ai_assist_enabled: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    notifications_enabled: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    video_enabled: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    quiet_hours_start: {
      type: Sequelize.STRING(5),
      allowNull: true
    },
    quiet_hours_end: {
      type: Sequelize.STRING(5),
      allowNull: true
    },
    timezone: {
      type: Sequelize.STRING(64),
      allowNull: false,
      defaultValue: 'Europe/London'
    },
    last_read_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    agora_uid: {
      type: Sequelize.STRING(64),
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

  await queryInterface.addIndex('ConversationParticipant', ['conversation_id', 'participant_type', 'participant_reference_id'], {
    unique: false,
    name: 'conversation_participant_lookup'
  });

  await queryInterface.createTable('ConversationMessage', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    conversation_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Conversation', key: 'id' },
      onDelete: 'CASCADE'
    },
    sender_participant_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'ConversationParticipant', key: 'id' },
      onDelete: 'SET NULL'
    },
    message_type: {
      type: Sequelize.ENUM('user', 'assistant', 'system', 'automation', 'notification'),
      allowNull: false,
      defaultValue: 'user'
    },
    body: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    ai_assist_used: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    ai_confidence_score: {
      type: Sequelize.DECIMAL(4, 2),
      allowNull: true
    },
    attachments: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: []
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

  await queryInterface.addIndex('ConversationMessage', ['conversation_id', 'created_at'], {
    name: 'conversation_message_timeline'
  });

  await queryInterface.createTable('MessageDelivery', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    conversation_message_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'ConversationMessage', key: 'id' },
      onDelete: 'CASCADE'
    },
    participant_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'ConversationParticipant', key: 'id' },
      onDelete: 'CASCADE'
    },
    status: {
      type: Sequelize.ENUM('pending', 'delivered', 'read', 'suppressed'),
      allowNull: false,
      defaultValue: 'pending'
    },
    suppressed_reason: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    delivered_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    read_at: {
      type: Sequelize.DATE,
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

  await queryInterface.addIndex('MessageDelivery', ['participant_id', 'status'], {
    name: 'message_delivery_notification_queue'
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('MessageDelivery');
  await queryInterface.dropTable('ConversationMessage');
  await queryInterface.dropTable('ConversationParticipant');
  await queryInterface.dropTable('Conversation');
}
