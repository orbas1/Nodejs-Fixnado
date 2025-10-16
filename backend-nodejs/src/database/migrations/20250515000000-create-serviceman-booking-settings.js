import { randomUUID } from 'node:crypto';

const TABLE = 'ServicemanBookingSetting';

export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable(TABLE, {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    serviceman_id: {
      type: Sequelize.UUID,
      allowNull: false,
      unique: true,
      references: { model: 'User', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    auto_accept_assignments: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    travel_buffer_minutes: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 30
    },
    max_daily_jobs: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 8
    },
    preferred_contact_channel: {
      type: Sequelize.STRING(24),
      allowNull: false,
      defaultValue: 'sms'
    },
    default_arrival_window_start: {
      type: Sequelize.STRING(8),
      allowNull: true
    },
    default_arrival_window_end: {
      type: Sequelize.STRING(8),
      allowNull: true
    },
    notes_template: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    safety_brief_template: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
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

  const [serviceman] = await queryInterface.sequelize.query(
    'SELECT id FROM "User" WHERE type = :role ORDER BY created_at ASC LIMIT 1',
    {
      type: Sequelize.QueryTypes.SELECT,
      replacements: { role: 'servicemen' }
    }
  );

  if (serviceman?.id) {
    await queryInterface.bulkInsert(TABLE, [
      {
        id: randomUUID(),
        serviceman_id: serviceman.id,
        auto_accept_assignments: false,
        travel_buffer_minutes: 30,
        max_daily_jobs: 6,
        preferred_contact_channel: 'sms',
        default_arrival_window_start: '08:00',
        default_arrival_window_end: '18:00',
        notes_template: 'Arrived on-site. Checked in with client contact. Logged safety briefing before commencing work.',
        safety_brief_template:
          'Confirm PPE compliance, review permit conditions, capture site photos before and after intervention, and log any hazards.',
        metadata: {
          quickReplies: [
            'En route with updated ETA.',
            'On-site and beginning diagnostics.',
            'Job complete – uploading supporting photos.'
          ],
          defaultChecklist: [
            { id: 'arrival', label: 'Confirm site access and contact', mandatory: true },
            { id: 'photos', label: 'Capture before/after photos', mandatory: true },
            { id: 'handoff', label: 'Complete client hand-off summary', mandatory: false }
          ],
          assetLibrary: []
        },
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  }
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable(TABLE);
}
