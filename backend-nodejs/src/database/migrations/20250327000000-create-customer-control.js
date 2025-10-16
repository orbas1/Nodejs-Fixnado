export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('customer_profiles', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'User',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    preferred_name_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    company_name_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    job_title_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    primary_email_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    primary_phone_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    preferred_contact_method_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    billing_email_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    timezone_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    locale_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    default_currency_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    avatar_url_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    cover_image_url_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    support_notes_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    escalation_window_minutes: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 120
    },
    marketing_opt_in: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    notifications_email_opt_in: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    notifications_sms_opt_in: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
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

  await queryInterface.addIndex('customer_profiles', ['user_id'], {
    unique: true,
    name: 'customer_profiles_user_unique'
  });

  await queryInterface.createTable('customer_contacts', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
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
    name_encrypted: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    role_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    email_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    phone_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    contact_type: {
      type: Sequelize.ENUM('operations', 'finance', 'support', 'billing', 'executive', 'other'),
      allowNull: false,
      defaultValue: 'operations'
    },
    is_primary: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    notes_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    avatar_url_encrypted: {
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

  await queryInterface.addIndex('customer_contacts', ['user_id'], {
    name: 'customer_contacts_user_idx'
  });

  await queryInterface.addIndex('customer_contacts', ['user_id'], {
    unique: true,
    name: 'customer_contacts_primary_unique',
    where: { is_primary: true }
  });

  await queryInterface.createTable('customer_locations', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
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
    label_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    address_line1_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    address_line2_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    city_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    region_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    postal_code_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    country_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    access_notes_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    is_primary: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
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

  await queryInterface.addIndex('customer_locations', ['user_id'], {
    name: 'customer_locations_user_idx'
  });

  await queryInterface.addIndex('customer_locations', ['user_id'], {
    unique: true,
    name: 'customer_locations_primary_unique',
    where: { is_primary: true }
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeIndex('customer_locations', 'customer_locations_primary_unique');
  await queryInterface.removeIndex('customer_locations', 'customer_locations_user_idx');
  await queryInterface.dropTable('customer_locations');

  await queryInterface.removeIndex('customer_contacts', 'customer_contacts_primary_unique');
  await queryInterface.removeIndex('customer_contacts', 'customer_contacts_user_idx');
  await queryInterface.dropTable('customer_contacts');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_customer_contacts_contact_type";');

  await queryInterface.removeIndex('customer_profiles', 'customer_profiles_user_unique');
  await queryInterface.dropTable('customer_profiles');
}
