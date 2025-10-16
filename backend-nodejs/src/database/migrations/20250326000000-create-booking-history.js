const ACTOR_ROLES = ['customer', 'provider', 'operations', 'support', 'finance', 'system'];
const ENTRY_TYPES = ['note', 'status_update', 'milestone', 'handoff', 'document'];
const ENTRY_STATES = ['open', 'in_progress', 'blocked', 'completed', 'cancelled'];

export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('BookingHistoryEntry', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    booking_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Booking', key: 'id' },
      onDelete: 'CASCADE'
    },
    title: {
      type: Sequelize.STRING(120),
      allowNull: false
    },
    entry_type: {
      type: Sequelize.ENUM(...ENTRY_TYPES),
      allowNull: false,
      defaultValue: 'note'
    },
    status: {
      type: Sequelize.ENUM(...ENTRY_STATES),
      allowNull: false,
      defaultValue: 'open'
    },
    summary: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    actor_id: {
      type: Sequelize.UUID,
      allowNull: true
    },
    actor_role: {
      type: Sequelize.ENUM(...ACTOR_ROLES),
      allowNull: false,
      defaultValue: 'customer'
    },
    occurred_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    },
    attachments: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: []
    },
    meta: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {}
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

  await queryInterface.addIndex('BookingHistoryEntry', ['booking_id', 'occurred_at'], {
    name: 'booking_history_booking_occurred_idx'
  });

  await queryInterface.addIndex('BookingHistoryEntry', ['booking_id', 'status'], {
    name: 'booking_history_status_idx'
  });
}

export async function down({ context: queryInterface, Sequelize }) {
  await queryInterface.removeIndex('BookingHistoryEntry', 'booking_history_status_idx');
  await queryInterface.removeIndex('BookingHistoryEntry', 'booking_history_booking_occurred_idx');
  await queryInterface.dropTable('BookingHistoryEntry');
  await queryInterface.sequelize.getQueryInterface().sequelize.query(
    `DROP TYPE IF EXISTS "enum_BookingHistoryEntry_entry_type"; DROP TYPE IF EXISTS "enum_BookingHistoryEntry_status"; DROP TYPE IF EXISTS "enum_BookingHistoryEntry_actor_role";`
  );
}
