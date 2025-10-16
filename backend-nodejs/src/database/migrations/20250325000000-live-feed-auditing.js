import { randomUUID } from 'node:crypto';

const EVENT_STATUS = ['open', 'investigating', 'resolved', 'dismissed'];
const EVENT_SEVERITY = ['info', 'low', 'medium', 'high', 'critical'];
const EVENT_SOURCE = ['system', 'manual'];

function defaultArrayLiteral(queryInterface) {
  const dialect = queryInterface.sequelize.getDialect();
  if (dialect === 'postgres') {
    return queryInterface.sequelize.literal("'[]'::jsonb");
  }
  return [];
}

function defaultObjectLiteral(queryInterface) {
  const dialect = queryInterface.sequelize.getDialect();
  if (dialect === 'postgres') {
    return queryInterface.sequelize.literal("'{}'::jsonb");
  }
  return {};
}

export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('live_feed_audit_events', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    occurred_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    event_type: {
      type: Sequelize.STRING(64),
      allowNull: false
    },
    source: {
      type: Sequelize.ENUM(...EVENT_SOURCE),
      allowNull: false,
      defaultValue: 'system'
    },
    status: {
      type: Sequelize.ENUM(...EVENT_STATUS),
      allowNull: false,
      defaultValue: 'open'
    },
    severity: {
      type: Sequelize.ENUM(...EVENT_SEVERITY),
      allowNull: false,
      defaultValue: 'info'
    },
    summary: {
      type: Sequelize.STRING(255),
      allowNull: false
    },
    details: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    resource_type: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    resource_id: {
      type: Sequelize.UUID,
      allowNull: true
    },
    post_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Post', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    post_snapshot: {
      type: Sequelize.JSONB,
      allowNull: true
    },
    zone_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'ServiceZone', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    zone_snapshot: {
      type: Sequelize.JSONB,
      allowNull: true
    },
    company_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Company', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    actor_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    actor_role: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    actor_persona: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    actor_snapshot: {
      type: Sequelize.JSONB,
      allowNull: true
    },
    assignee_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    next_action_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    attachments: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: defaultArrayLiteral(queryInterface)
    },
    tags: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: defaultArrayLiteral(queryInterface)
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: defaultObjectLiteral(queryInterface)
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

  await queryInterface.createTable('live_feed_audit_notes', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    audit_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'live_feed_audit_events', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    author_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'User', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    author_role: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    note: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    tags: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: defaultArrayLiteral(queryInterface)
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

  await queryInterface.addIndex('live_feed_audit_events', ['occurred_at'], {
    name: 'live_feed_audit_events_occurred_at_idx'
  });
  await queryInterface.addIndex('live_feed_audit_events', ['event_type'], {
    name: 'live_feed_audit_events_event_type_idx'
  });
  await queryInterface.addIndex('live_feed_audit_events', ['status'], {
    name: 'live_feed_audit_events_status_idx'
  });
  await queryInterface.addIndex('live_feed_audit_events', ['severity'], {
    name: 'live_feed_audit_events_severity_idx'
  });
  await queryInterface.addIndex('live_feed_audit_events', ['post_id'], {
    name: 'live_feed_audit_events_post_id_idx'
  });
  await queryInterface.addIndex('live_feed_audit_events', ['zone_id'], {
    name: 'live_feed_audit_events_zone_id_idx'
  });
  await queryInterface.addIndex('live_feed_audit_events', ['actor_id'], {
    name: 'live_feed_audit_events_actor_id_idx'
  });
  await queryInterface.addIndex('live_feed_audit_events', ['assignee_id'], {
    name: 'live_feed_audit_events_assignee_id_idx'
  });
  await queryInterface.addIndex('live_feed_audit_notes', ['audit_id'], {
    name: 'live_feed_audit_notes_audit_id_idx'
  });
  await queryInterface.addIndex('live_feed_audit_notes', ['created_at'], {
    name: 'live_feed_audit_notes_created_at_idx'
  });

  // Seed a placeholder audit so dashboards can render meaningful data during bootstrap.
  await queryInterface.bulkInsert('live_feed_audit_events', [
    {
      id: randomUUID(),
      occurred_at: new Date(),
      event_type: 'live_feed.post.created',
      source: 'system',
      status: 'open',
      severity: 'info',
      summary: 'Demo live feed job created',
      details: 'Initial audit record seeded for control centre dashboards.',
      resource_type: 'post',
      resource_id: null,
      post_id: null,
      post_snapshot: defaultObjectLiteral(queryInterface),
      zone_id: null,
      zone_snapshot: defaultObjectLiteral(queryInterface),
      company_id: null,
      actor_id: null,
      actor_role: 'system',
      actor_persona: null,
      actor_snapshot: defaultObjectLiteral(queryInterface),
      assignee_id: null,
      next_action_at: null,
      attachments: defaultArrayLiteral(queryInterface),
      tags: defaultArrayLiteral(queryInterface),
      metadata: defaultObjectLiteral(queryInterface),
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
}

export async function down({ context: queryInterface }) {
  await queryInterface.bulkDelete('live_feed_audit_notes', {});
  await queryInterface.bulkDelete('live_feed_audit_events', {});
  await queryInterface.removeIndex('live_feed_audit_notes', 'live_feed_audit_notes_created_at_idx');
  await queryInterface.removeIndex('live_feed_audit_notes', 'live_feed_audit_notes_audit_id_idx');
  await queryInterface.removeIndex('live_feed_audit_events', 'live_feed_audit_events_assignee_id_idx');
  await queryInterface.removeIndex('live_feed_audit_events', 'live_feed_audit_events_actor_id_idx');
  await queryInterface.removeIndex('live_feed_audit_events', 'live_feed_audit_events_zone_id_idx');
  await queryInterface.removeIndex('live_feed_audit_events', 'live_feed_audit_events_post_id_idx');
  await queryInterface.removeIndex('live_feed_audit_events', 'live_feed_audit_events_severity_idx');
  await queryInterface.removeIndex('live_feed_audit_events', 'live_feed_audit_events_status_idx');
  await queryInterface.removeIndex('live_feed_audit_events', 'live_feed_audit_events_event_type_idx');
  await queryInterface.removeIndex('live_feed_audit_events', 'live_feed_audit_events_occurred_at_idx');

  await queryInterface.dropTable('live_feed_audit_notes');
  await queryInterface.dropTable('live_feed_audit_events');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_live_feed_audit_events_status"');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_live_feed_audit_events_severity"');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_live_feed_audit_events_source"');
}
