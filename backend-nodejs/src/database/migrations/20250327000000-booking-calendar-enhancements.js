'use strict';

const TABLE = 'bookings';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(TABLE, 'title', {
      type: Sequelize.STRING(160),
      allowNull: true
    });

    await queryInterface.addColumn(TABLE, 'location', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    await queryInterface.addColumn(TABLE, 'instructions', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.createTable('booking_notes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true
      },
      booking_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'bookings',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      author_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      author_type: {
        type: Sequelize.STRING(32),
        allowNull: true
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      attachments: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      is_pinned: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
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

    await queryInterface.addIndex('booking_notes', ['booking_id']);
    await queryInterface.addIndex('booking_notes', ['booking_id', 'is_pinned']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('booking_notes', ['booking_id']);
    await queryInterface.removeIndex('booking_notes', ['booking_id', 'is_pinned']);
    await queryInterface.dropTable('booking_notes');
    await queryInterface.removeColumn(TABLE, 'instructions');
    await queryInterface.removeColumn(TABLE, 'location');
    await queryInterface.removeColumn(TABLE, 'title');
  }
};
