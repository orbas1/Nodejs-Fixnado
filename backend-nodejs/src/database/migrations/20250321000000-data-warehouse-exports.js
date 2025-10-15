import { randomUUID } from 'node:crypto';

export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('warehouse_export_runs', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    dataset: {
      type: Sequelize.STRING(64),
      allowNull: false
    },
    status: {
      type: Sequelize.ENUM('pending', 'running', 'succeeded', 'failed'),
      allowNull: false,
      defaultValue: 'pending'
    },
    region_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Region', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    triggered_by: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    run_started_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    run_finished_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    row_count: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    file_path: {
      type: Sequelize.STRING(512),
      allowNull: true
    },
    last_cursor: {
      type: Sequelize.JSONB,
      allowNull: true
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: true
    },
    error: {
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

  await queryInterface.addIndex('warehouse_export_runs', ['dataset', 'status']);
  await queryInterface.addIndex('warehouse_export_runs', ['region_id']);
  await queryInterface.addIndex('warehouse_export_runs', ['run_started_at']);

  await queryInterface.bulkInsert('warehouse_export_runs', [
    {
      id: randomUUID(),
      dataset: 'orders',
      status: 'pending',
      run_started_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
      metadata: {
        note: 'Seed record to validate CDC pipelines during migration rehearsal.'
      }
    }
  ]);
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('warehouse_export_runs');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_warehouse_export_runs_status"');
}
