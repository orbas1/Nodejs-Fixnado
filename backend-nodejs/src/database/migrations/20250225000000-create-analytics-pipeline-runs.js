const TABLE_NAME = 'AnalyticsPipelineRun';
const STATUS_INDEX = 'analytics_pipeline_run_status';
const STARTED_AT_INDEX = 'analytics_pipeline_run_started_at';

export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable(TABLE_NAME, {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    status: {
      type: Sequelize.STRING(16),
      allowNull: false
    },
    started_at: {
      type: Sequelize.DATE,
      allowNull: false
    },
    finished_at: {
      type: Sequelize.DATE,
      allowNull: false
    },
    events_processed: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    events_failed: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    batches_delivered: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    purged_events: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    triggered_by: {
      type: Sequelize.STRING(96),
      allowNull: false,
      defaultValue: 'scheduler'
    },
    last_error: {
      type: Sequelize.TEXT,
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
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  await queryInterface.addIndex(TABLE_NAME, ['status'], { name: STATUS_INDEX });
  await queryInterface.addIndex(TABLE_NAME, ['started_at'], { name: STARTED_AT_INDEX });
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeIndex(TABLE_NAME, STATUS_INDEX);
  await queryInterface.removeIndex(TABLE_NAME, STARTED_AT_INDEX);
  await queryInterface.dropTable(TABLE_NAME);
}
