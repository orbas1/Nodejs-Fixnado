export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('ServicemanProfile', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    company_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Company', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    display_name: {
      type: Sequelize.STRING(160),
      allowNull: false
    },
    role: {
      type: Sequelize.STRING(160),
      allowNull: false
    },
    status: {
      type: Sequelize.ENUM('active', 'standby', 'on_leave', 'training'),
      allowNull: false,
      defaultValue: 'active'
    },
    employment_type: {
      type: Sequelize.ENUM('full_time', 'part_time', 'contractor'),
      allowNull: false,
      defaultValue: 'full_time'
    },
    primary_zone: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    contact_email_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    contact_phone_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    avatar_url: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    skills: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    notes_encrypted: {
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

  await queryInterface.createTable('ServicemanShift', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    profile_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'ServicemanProfile', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    shift_date: {
      type: Sequelize.DATEONLY,
      allowNull: false
    },
    start_time: {
      type: Sequelize.STRING(5),
      allowNull: false
    },
    end_time: {
      type: Sequelize.STRING(5),
      allowNull: false
    },
    status: {
      type: Sequelize.ENUM('available', 'booked', 'standby', 'travel', 'off'),
      allowNull: false,
      defaultValue: 'available'
    },
    assignment_title: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    location: {
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
      defaultValue: Sequelize.NOW
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    }
  });

  await queryInterface.createTable('ServicemanCertification', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    profile_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'ServicemanProfile', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    name: {
      type: Sequelize.STRING(160),
      allowNull: false
    },
    issuer: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    status: {
      type: Sequelize.ENUM('valid', 'expiring', 'expired', 'revoked'),
      allowNull: false,
      defaultValue: 'valid'
    },
    issued_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    expires_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    document_url: {
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
      defaultValue: Sequelize.NOW
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    }
  });

  await queryInterface.addIndex('ServicemanProfile', ['company_id']);
  await queryInterface.addIndex('ServicemanProfile', ['status']);
  await queryInterface.addIndex('ServicemanShift', ['profile_id', 'shift_date']);
  await queryInterface.addIndex('ServicemanCertification', ['profile_id', 'status']);
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeIndex('ServicemanCertification', ['profile_id', 'status']);
  await queryInterface.removeIndex('ServicemanShift', ['profile_id', 'shift_date']);
  await queryInterface.removeIndex('ServicemanProfile', ['status']);
  await queryInterface.removeIndex('ServicemanProfile', ['company_id']);

  await queryInterface.dropTable('ServicemanCertification');
  await queryInterface.dropTable('ServicemanShift');
  await queryInterface.dropTable('ServicemanProfile');

  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ServicemanProfile_status"');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ServicemanProfile_employment_type"');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ServicemanShift_status"');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ServicemanCertification_status"');
}
