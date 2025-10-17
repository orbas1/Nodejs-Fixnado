export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('serviceman_profiles', {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.literal('uuid_generate_v4()')
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'User',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    display_name: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    call_sign: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    status: {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: 'active'
    },
    avatar_url: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    bio: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    timezone: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    primary_region: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    coverage_radius_km: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 25
    },
    travel_buffer_minutes: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 30
    },
    auto_accept_assignments: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    allow_after_hours: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    notify_ops_team: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    default_vehicle: {
      type: Sequelize.STRING(96),
      allowNull: true
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

  await queryInterface.addConstraint('serviceman_profiles', {
    type: 'unique',
    name: 'serviceman_profiles_user_id_unique',
    fields: ['user_id']
  });

  await queryInterface.createTable('serviceman_shift_rules', {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.literal('uuid_generate_v4()')
    },
    profile_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'serviceman_profiles',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    day_of_week: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    start_time: {
      type: Sequelize.TIME,
      allowNull: false
    },
    end_time: {
      type: Sequelize.TIME,
      allowNull: false
    },
    status: {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: 'available'
    },
    location_label: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    notes: {
      type: Sequelize.TEXT,
      allowNull: true
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

  await queryInterface.addIndex('serviceman_shift_rules', ['profile_id', 'day_of_week'], {
    name: 'serviceman_shift_rules_profile_day_idx'
  });

  await queryInterface.createTable('serviceman_certifications', {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.literal('uuid_generate_v4()')
    },
    profile_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'serviceman_profiles',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    title: {
      type: Sequelize.STRING(180),
      allowNull: false
    },
    issuer: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    credential_id: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    issued_on: {
      type: Sequelize.DATE,
      allowNull: true
    },
    expires_on: {
      type: Sequelize.DATE,
      allowNull: true
    },
    attachment_url: {
      type: Sequelize.TEXT,
      allowNull: true
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

  await queryInterface.createTable('serviceman_equipment_items', {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.literal('uuid_generate_v4()')
    },
    profile_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'serviceman_profiles',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    name: {
      type: Sequelize.STRING(180),
      allowNull: false
    },
    serial_number: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    status: {
      type: Sequelize.STRING(48),
      allowNull: false,
      defaultValue: 'ready'
    },
    maintenance_due_on: {
      type: Sequelize.DATE,
      allowNull: true
    },
    assigned_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    image_url: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    notes: {
      type: Sequelize.TEXT,
      allowNull: true
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

  await queryInterface.addIndex('serviceman_equipment_items', ['profile_id', 'status'], {
    name: 'serviceman_equipment_profile_status_idx'
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('serviceman_equipment_items');
  await queryInterface.dropTable('serviceman_certifications');
  await queryInterface.dropTable('serviceman_shift_rules');
  await queryInterface.dropTable('serviceman_profiles');
}
