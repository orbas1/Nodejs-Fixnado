import { DateTime } from 'luxon';

export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.addColumn('data_subject_requests', 'due_at', {
    type: Sequelize.DATE,
    allowNull: true
  });

  const [rows] = await queryInterface.sequelize.query(
    'SELECT id, requested_at FROM data_subject_requests'
  );

  const defaultWindowDays = 30;
  const updatePromises = rows.map((row) => {
    const requestedAt = row.requested_at ? DateTime.fromJSDate(new Date(row.requested_at)) : DateTime.utc();
    const dueAt = requestedAt.plus({ days: defaultWindowDays }).toJSDate();
    return queryInterface.sequelize.query(
      'UPDATE data_subject_requests SET due_at = :dueAt WHERE id = :id',
      { replacements: { dueAt, id: row.id } }
    );
  });
  await Promise.all(updatePromises);

  const dialect = queryInterface.sequelize.getDialect();
  if (dialect !== 'sqlite') {
    await queryInterface.changeColumn('data_subject_requests', 'due_at', {
      type: Sequelize.DATE,
      allowNull: false
    });
  } else {
    await queryInterface.sequelize.query(
      'UPDATE data_subject_requests SET due_at = COALESCE(due_at, requested_at)'
    );
  }

  await queryInterface.addIndex('data_subject_requests', ['due_at']);
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeIndex('data_subject_requests', ['due_at']);
  await queryInterface.removeColumn('data_subject_requests', 'due_at');
}
