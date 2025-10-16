import { randomUUID } from 'node:crypto';

const TABLE = 'CustomerAccountSetting';

export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable(TABLE, {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
      unique: true,
      references: { model: 'User', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    timezone: {
      type: Sequelize.STRING(120),
      allowNull: false,
      defaultValue: 'Europe/London'
    },
    locale: {
      type: Sequelize.STRING(24),
      allowNull: false,
      defaultValue: 'en-GB'
    },
    default_currency: {
      type: Sequelize.STRING(12),
      allowNull: false,
      defaultValue: 'GBP'
    },
    weekly_summary_enabled: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    dispatch_alerts_enabled: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    escrow_alerts_enabled: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    concierge_alerts_enabled: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    quiet_hours_start: {
      type: Sequelize.STRING(8),
      allowNull: true
    },
    quiet_hours_end: {
      type: Sequelize.STRING(8),
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

  const seedUser = await queryInterface.sequelize
    .query('SELECT id FROM "User" ORDER BY created_at ASC LIMIT 1', { type: Sequelize.QueryTypes.SELECT })
    .then((rows) => rows?.[0]?.id ?? null);

  if (seedUser) {
    await queryInterface.bulkInsert(TABLE, [
      {
        id: randomUUID(),
        user_id: seedUser,
        timezone: 'Europe/London',
        locale: 'en-GB',
        default_currency: 'GBP',
        weekly_summary_enabled: true,
        dispatch_alerts_enabled: true,
        escrow_alerts_enabled: true,
        concierge_alerts_enabled: true,
        quiet_hours_start: null,
        quiet_hours_end: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  }
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable(TABLE);
}
