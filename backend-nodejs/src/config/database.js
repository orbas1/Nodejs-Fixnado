import { Sequelize } from 'sequelize';
import config from './index.js';

const sequelize = new Sequelize(config.database.name, config.database.user, config.database.password, {
  host: config.database.host,
  port: config.database.port,
  dialect: 'mysql',
  logging: config.env === 'development' ? console.info : false,
  define: {
    underscored: true,
    freezeTableName: true
  }
});

export default sequelize;
