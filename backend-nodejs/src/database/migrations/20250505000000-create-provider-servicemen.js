'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ProviderServicemen', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true
      },
      company_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Companies',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(160),
        allowNull: false
      },
      role: {
        type: Sequelize.STRING(160),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(180),
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING(40),
        allowNull: true
      },
      status: {
        type: Sequelize.STRING(60),
        allowNull: false,
        defaultValue: 'active'
      },
      availability_status: {
        type: Sequelize.STRING(60),
        allowNull: false,
        defaultValue: 'available'
      },
      availability_percentage: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 100
      },
      hourly_rate: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      currency: {
        type: Sequelize.STRING(12),
        allowNull: true
      },
      avatar_url: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      skills: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      certifications: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      meta: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    await queryInterface.createTable('ProviderServicemanAvailabilities', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true
      },
      serviceman_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'ProviderServicemen',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      day_of_week: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      start_time: {
        type: Sequelize.STRING(8),
        allowNull: false
      },
      end_time: {
        type: Sequelize.STRING(8),
        allowNull: false
      },
      timezone: {
        type: Sequelize.STRING(64),
        allowNull: false,
        defaultValue: 'Europe/London'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    await queryInterface.createTable('ProviderServicemanZones', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true
      },
      serviceman_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'ProviderServicemen',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      zone_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'ServiceZones',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      is_primary: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    await queryInterface.createTable('ProviderServicemanMedia', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true
      },
      serviceman_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'ProviderServicemen',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      url: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      label: {
        type: Sequelize.STRING(160),
        allowNull: true
      },
      type: {
        type: Sequelize.STRING(40),
        allowNull: false,
        defaultValue: 'gallery'
      },
      is_primary: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    await queryInterface.addIndex('ProviderServicemen', ['company_id']);
    await queryInterface.addIndex('ProviderServicemen', ['status']);
    await queryInterface.addIndex('ProviderServicemanAvailabilities', ['serviceman_id']);
    await queryInterface.addIndex('ProviderServicemanZones', ['serviceman_id']);
    await queryInterface.addIndex('ProviderServicemanZones', ['zone_id']);
    await queryInterface.addIndex('ProviderServicemanMedia', ['serviceman_id']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('ProviderServicemanMedia', ['serviceman_id']);
    await queryInterface.removeIndex('ProviderServicemanZones', ['zone_id']);
    await queryInterface.removeIndex('ProviderServicemanZones', ['serviceman_id']);
    await queryInterface.removeIndex('ProviderServicemanAvailabilities', ['serviceman_id']);
    await queryInterface.removeIndex('ProviderServicemen', ['status']);
    await queryInterface.removeIndex('ProviderServicemen', ['company_id']);

    await queryInterface.dropTable('ProviderServicemanMedia');
    await queryInterface.dropTable('ProviderServicemanZones');
    await queryInterface.dropTable('ProviderServicemanAvailabilities');
    await queryInterface.dropTable('ProviderServicemen');
  }
};
