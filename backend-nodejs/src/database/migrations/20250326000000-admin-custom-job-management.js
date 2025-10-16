import { DataTypes } from 'sequelize';

export async function up(queryInterface) {
  const dialect = queryInterface.sequelize.getDialect();

  await queryInterface.addColumn('Post', 'internal_notes', {
    type: DataTypes.TEXT,
    allowNull: true
  });

  await queryInterface.addColumn('Post', 'awarded_bid_id', {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'CustomJobBid', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  });

  await queryInterface.addColumn('Post', 'awarded_by', {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'User', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  });

  await queryInterface.addColumn('Post', 'awarded_at', {
    type: DataTypes.DATE,
    allowNull: true
  });

  await queryInterface.addColumn('Post', 'closed_at', {
    type: DataTypes.DATE,
    allowNull: true
  });

  if (dialect === 'postgres') {
    await queryInterface.sequelize.query('ALTER TYPE "enum_Post_status" ADD VALUE IF NOT EXISTS \'cancelled\';');
  }

  await queryInterface.changeColumn('Post', 'status', {
    type: DataTypes.ENUM('open', 'assigned', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'open'
  });

  await queryInterface.addIndex('Post', ['status']);
  await queryInterface.addIndex('Post', ['awarded_bid_id']);
}

export async function down(queryInterface) {
  const dialect = queryInterface.sequelize.getDialect();

  await queryInterface.removeIndex('Post', ['awarded_bid_id']);
  await queryInterface.removeIndex('Post', ['status']);

  await queryInterface.removeColumn('Post', 'closed_at');
  await queryInterface.removeColumn('Post', 'awarded_at');
  await queryInterface.removeColumn('Post', 'awarded_by');
  await queryInterface.removeColumn('Post', 'awarded_bid_id');
  await queryInterface.removeColumn('Post', 'internal_notes');

  if (dialect === 'postgres') {
    await queryInterface.sequelize.query("UPDATE \"Post\" SET \"status\" = 'open' WHERE \"status\" = 'cancelled';");
    await queryInterface.sequelize.query('ALTER TABLE "Post" ALTER COLUMN "status" TYPE VARCHAR(32) USING "status"::text;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Post_status";');
    await queryInterface.sequelize.query('CREATE TYPE "enum_Post_status" AS ENUM (\'open\', \'assigned\', \'completed\');');
    await queryInterface.sequelize.query('ALTER TABLE "Post" ALTER COLUMN "status" TYPE "enum_Post_status" USING "status"::text::"enum_Post_status";');
  }

  await queryInterface.changeColumn('Post', 'status', {
    type: DataTypes.ENUM('open', 'assigned', 'completed'),
    allowNull: false,
    defaultValue: 'open'
  });
}
