export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.addColumn(
      'ServicemanProfile',
      'employer_name',
      {
        type: Sequelize.STRING(160),
        allowNull: true
      },
      { transaction }
    );

    await queryInterface.addColumn(
      'ServicemanProfile',
      'employer_type',
      {
        type: Sequelize.ENUM('provider', 'sme', 'enterprise'),
        allowNull: false,
        defaultValue: 'provider'
      },
      { transaction }
    );

    await queryInterface.addColumn(
      'ServicemanProfile',
      'employer_contact',
      {
        type: Sequelize.STRING(160),
        allowNull: true
      },
      { transaction }
    );

    await queryInterface.addIndex('ServicemanProfile', ['employer_type'], { transaction });

    await queryInterface.sequelize.query(
      'ALTER TYPE "enum_ServicemanShift_status" RENAME TO "enum_ServicemanShift_status_old";',
      { transaction }
    );

    await queryInterface.sequelize.query(
      "CREATE TYPE \"enum_ServicemanShift_status\" AS ENUM ('submitted', 'confirmed', 'needs_revision', 'provider_cancelled', 'completed');",
      { transaction }
    );

    await queryInterface.sequelize.query(
      'ALTER TABLE "ServicemanShift" ALTER COLUMN "status" TYPE "enum_ServicemanShift_status" USING "status"::text::"enum_ServicemanShift_status";',
      { transaction }
    );

    await queryInterface.sequelize.query(
      "ALTER TABLE \"ServicemanShift\" ALTER COLUMN \"status\" SET DEFAULT 'submitted';",
      { transaction }
    );

    await queryInterface.sequelize.query('DROP TYPE "enum_ServicemanShift_status_old";', { transaction });
  });
}

export async function down({ context: queryInterface, Sequelize }) {
  await queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.sequelize.query(
      'CREATE TYPE "enum_ServicemanShift_status_old" AS ENUM (\'available\', \'booked\', \'standby\', \'travel\', \'off\');',
      { transaction }
    );

    await queryInterface.sequelize.query(
      'ALTER TABLE "ServicemanShift" ALTER COLUMN "status" TYPE "enum_ServicemanShift_status_old" USING "status"::text::"enum_ServicemanShift_status_old";',
      { transaction }
    );

    await queryInterface.sequelize.query(
      "ALTER TABLE \"ServicemanShift\" ALTER COLUMN \"status\" SET DEFAULT 'available';",
      { transaction }
    );

    await queryInterface.sequelize.query('DROP TYPE "enum_ServicemanShift_status";', { transaction });

    await queryInterface.sequelize.query(
      'ALTER TYPE "enum_ServicemanShift_status_old" RENAME TO "enum_ServicemanShift_status";',
      { transaction }
    );

    await queryInterface.removeIndex('ServicemanProfile', ['employer_type'], { transaction });

    await queryInterface.removeColumn('ServicemanProfile', 'employer_contact', { transaction });

    await queryInterface.removeColumn('ServicemanProfile', 'employer_type', { transaction });

    await queryInterface.removeColumn('ServicemanProfile', 'employer_name', { transaction });

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ServicemanProfile_employer_type";', { transaction });
  });
}
