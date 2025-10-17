import { randomUUID } from 'node:crypto';

const INTEGRATIONS_TABLE = 'provider_byok_integrations';
const AUDIT_TABLE = 'provider_byok_audit_logs';

export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable(INTEGRATIONS_TABLE, {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      defaultValue: Sequelize.literal('uuid_generate_v4()'),
      primaryKey: true
    },
    company_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Company', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    integration: {
      type: Sequelize.STRING(64),
      allowNull: false
    },
    display_name: {
      type: Sequelize.STRING(120),
      allowNull: false
    },
    status: {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: 'inactive'
    },
    settings: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    credentials_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    credential_fingerprint: {
      type: Sequelize.STRING(128),
      allowNull: true
    },
    last_rotated_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    last_rotated_by: {
      type: Sequelize.UUID,
      allowNull: true
    },
    last_test_status: {
      type: Sequelize.STRING(32),
      allowNull: true
    },
    last_test_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    last_test_notes: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
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
      defaultValue: Sequelize.literal('NOW()')
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('NOW()')
    }
  });

  await queryInterface.addConstraint(INTEGRATIONS_TABLE, {
    type: 'unique',
    name: 'provider_byok_integrations_company_integration_unique',
    fields: ['company_id', 'integration']
  });

  await queryInterface.addIndex(INTEGRATIONS_TABLE, {
    name: 'provider_byok_integrations_company_status_idx',
    fields: ['company_id', 'status']
  });

  await queryInterface.createTable(AUDIT_TABLE, {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      defaultValue: Sequelize.literal('uuid_generate_v4()'),
      primaryKey: true
    },
    integration_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: INTEGRATIONS_TABLE, key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    company_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Company', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    event_type: {
      type: Sequelize.STRING(64),
      allowNull: false
    },
    event_detail: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    actor_id: {
      type: Sequelize.UUID,
      allowNull: true
    },
    actor_type: {
      type: Sequelize.STRING(32),
      allowNull: true
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('NOW()')
    }
  });

  await queryInterface.addIndex(AUDIT_TABLE, {
    name: 'provider_byok_audit_logs_integration_idx',
    fields: ['integration_id', 'created_at']
  });

  await queryInterface.addIndex(AUDIT_TABLE, {
    name: 'provider_byok_audit_logs_company_idx',
    fields: ['company_id', 'created_at']
  });

  // Seed a baseline integration so dashboards have content during initial deployment
  const [seedCompany] = await queryInterface.sequelize.query(
    'SELECT id FROM "Company" ORDER BY created_at ASC LIMIT 1',
    { type: Sequelize.QueryTypes.SELECT }
  );

  if (seedCompany?.id) {
    await queryInterface.bulkInsert(INTEGRATIONS_TABLE, [
      {
        id: randomUUID(),
        company_id: seedCompany.id,
        integration: 'openai',
        display_name: 'OpenAI Completions',
        status: 'inactive',
        settings: {
          provider: 'openai',
          baseUrl: '',
          defaultModel: '',
          allowedRoles: ['provider_admin'],
          rotationIntervalDays: 45
        },
        metadata: {
          createdFrom: 'migration_seed'
        },
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  }
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable(AUDIT_TABLE);
  await queryInterface.dropTable(INTEGRATIONS_TABLE);
}
