export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('ServicemanIdentity', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    serviceman_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'User', key: 'id' },
      onDelete: 'CASCADE',
      unique: true
    },
    status: {
      type: Sequelize.ENUM('pending', 'in_review', 'approved', 'rejected', 'suspended', 'expired'),
      allowNull: false,
      defaultValue: 'pending'
    },
    risk_rating: {
      type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'medium'
    },
    verification_level: {
      type: Sequelize.ENUM('standard', 'enhanced', 'expedited'),
      allowNull: false,
      defaultValue: 'standard'
    },
    reviewer_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      onDelete: 'SET NULL'
    },
    requested_at: { type: Sequelize.DATE, allowNull: true },
    submitted_at: { type: Sequelize.DATE, allowNull: true },
    approved_at: { type: Sequelize.DATE, allowNull: true },
    expires_at: { type: Sequelize.DATE, allowNull: true },
    notes: { type: Sequelize.TEXT, allowNull: true },
    metadata: { type: Sequelize.JSONB, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
  });

  await queryInterface.createTable('ServicemanIdentityDocument', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    identity_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'ServicemanIdentity', key: 'id' },
      onDelete: 'CASCADE'
    },
    document_type: {
      type: Sequelize.ENUM(
        'passport',
        'driving_license',
        'work_permit',
        'national_id',
        'insurance_certificate',
        'other'
      ),
      allowNull: false
    },
    status: {
      type: Sequelize.ENUM('pending', 'in_review', 'approved', 'rejected', 'expired'),
      allowNull: false,
      defaultValue: 'pending'
    },
    document_number: { type: Sequelize.STRING, allowNull: true },
    issuing_country: { type: Sequelize.STRING, allowNull: true },
    issued_at: { type: Sequelize.DATE, allowNull: true },
    expires_at: { type: Sequelize.DATE, allowNull: true },
    file_url: { type: Sequelize.STRING, allowNull: true },
    notes: { type: Sequelize.TEXT, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
  });

  await queryInterface.createTable('ServicemanIdentityCheck', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    identity_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'ServicemanIdentity', key: 'id' },
      onDelete: 'CASCADE'
    },
    label: { type: Sequelize.STRING, allowNull: false },
    status: {
      type: Sequelize.ENUM('not_started', 'in_progress', 'blocked', 'completed'),
      allowNull: false,
      defaultValue: 'not_started'
    },
    owner: { type: Sequelize.STRING, allowNull: true },
    due_at: { type: Sequelize.DATE, allowNull: true },
    completed_at: { type: Sequelize.DATE, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
  });

  await queryInterface.createTable('ServicemanIdentityWatcher', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    identity_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'ServicemanIdentity', key: 'id' },
      onDelete: 'CASCADE'
    },
    email: { type: Sequelize.STRING, allowNull: false },
    name: { type: Sequelize.STRING, allowNull: true },
    role: {
      type: Sequelize.ENUM('operations_lead', 'compliance_specialist', 'safety_manager', 'account_manager', 'other'),
      allowNull: false,
      defaultValue: 'operations_lead'
    },
    notified_at: { type: Sequelize.DATE, allowNull: true },
    last_seen_at: { type: Sequelize.DATE, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
  });

  await queryInterface.addIndex('ServicemanIdentityWatcher', ['identity_id', 'email'], {
    name: 'serviceman_identity_watcher_unique_email',
    unique: true
  });

  await queryInterface.createTable('ServicemanIdentityEvent', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    identity_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'ServicemanIdentity', key: 'id' },
      onDelete: 'CASCADE'
    },
    event_type: {
      type: Sequelize.ENUM(
        'note',
        'status_change',
        'document_update',
        'check_update',
        'watcher_update',
        'escalation',
        'review_request',
        'expiry'
      ),
      allowNull: false
    },
    title: { type: Sequelize.STRING, allowNull: false },
    description: { type: Sequelize.TEXT, allowNull: true },
    occurred_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    actor_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      onDelete: 'SET NULL'
    },
    metadata: { type: Sequelize.JSONB, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('ServicemanIdentityEvent');
  await queryInterface.dropTable('ServicemanIdentityWatcher');
  await queryInterface.dropTable('ServicemanIdentityCheck');
  await queryInterface.dropTable('ServicemanIdentityDocument');
  await queryInterface.dropTable('ServicemanIdentity');

  const dropType = (name) => queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${name}"`);

  await dropType('enum_ServicemanIdentity_status');
  await dropType('enum_ServicemanIdentity_risk_rating');
  await dropType('enum_ServicemanIdentity_verification_level');
  await dropType('enum_ServicemanIdentityDocument_document_type');
  await dropType('enum_ServicemanIdentityDocument_status');
  await dropType('enum_ServicemanIdentityCheck_status');
  await dropType('enum_ServicemanIdentityWatcher_role');
  await dropType('enum_ServicemanIdentityEvent_event_type');
}
