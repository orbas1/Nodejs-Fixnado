const TABLE_NAME = 'AnalyticsEvent';
const NEXT_INGEST_INDEX = 'analytics_event_next_ingest';

export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.addColumn(TABLE_NAME, 'ingested_at', {
    type: Sequelize.DATE,
    allowNull: true
  });

  await queryInterface.addColumn(TABLE_NAME, 'ingestion_attempts', {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0
  });

  await queryInterface.addColumn(TABLE_NAME, 'last_ingestion_error', {
    type: Sequelize.TEXT,
    allowNull: true
  });

  await queryInterface.addColumn(TABLE_NAME, 'next_ingest_attempt_at', {
    type: Sequelize.DATE,
    allowNull: true,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  });

  await queryInterface.addColumn(TABLE_NAME, 'retention_expires_at', {
    type: Sequelize.DATE,
    allowNull: true
  });

  await queryInterface.addIndex(TABLE_NAME, ['next_ingest_attempt_at'], {
    name: NEXT_INGEST_INDEX
  });

  await queryInterface.sequelize.query(
    `UPDATE "${TABLE_NAME}" SET next_ingest_attempt_at = received_at WHERE next_ingest_attempt_at IS NULL;`
  );
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeIndex(TABLE_NAME, NEXT_INGEST_INDEX);
  await queryInterface.removeColumn(TABLE_NAME, 'retention_expires_at');
  await queryInterface.removeColumn(TABLE_NAME, 'next_ingest_attempt_at');
  await queryInterface.removeColumn(TABLE_NAME, 'last_ingestion_error');
  await queryInterface.removeColumn(TABLE_NAME, 'ingestion_attempts');
  await queryInterface.removeColumn(TABLE_NAME, 'ingested_at');
}
