export async function up({ context: queryInterface, Sequelize }) {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    const enumName = 'enum_User_type';
    const dialect = queryInterface.sequelize.getDialect();

    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(
        `ALTER TYPE "${enumName}" ADD VALUE IF NOT EXISTS 'admin';`,
        { transaction }
      );
    } else {
      await queryInterface.changeColumn(
        'User',
        'type',
        {
          type: Sequelize.ENUM('user', 'company', 'servicemen', 'admin'),
          allowNull: false,
          defaultValue: 'user'
        },
        { transaction }
      );
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function down({ context: queryInterface, Sequelize }) {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    const enumName = 'enum_User_type';
    const dialect = queryInterface.sequelize.getDialect();

    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(
        `ALTER TYPE "${enumName}" RENAME TO "${enumName}_old";`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `CREATE TYPE "${enumName}" AS ENUM ('user', 'company', 'servicemen');`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "User" ALTER COLUMN "type" TYPE "${enumName}" USING "type"::text::"${enumName}";`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `DROP TYPE "${enumName}_old";`,
        { transaction }
      );
    } else {
      await queryInterface.changeColumn(
        'User',
        'type',
        {
          type: Sequelize.ENUM('user', 'company', 'servicemen'),
          allowNull: false,
          defaultValue: 'user'
        },
        { transaction }
      );
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
