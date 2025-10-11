import { Sequelize } from 'sequelize';
import config from './index.js';

function buildSequelizeInstance() {
  const sharedOptions = {
    logging: config.env === 'development' ? console.info : false,
    define: {
      underscored: true,
      freezeTableName: true
    }
  };

  const requestedDialect = (process.env.DB_DIALECT || '').toLowerCase();

  if (config.env === 'test' || requestedDialect === 'sqlite') {
    return new Sequelize('sqlite::memory:', {
      ...sharedOptions,
      dialect: 'sqlite',
      storage: process.env.DB_STORAGE || ':memory:'
    });
  }

  if (process.env.DB_URL) {
    return new Sequelize(process.env.DB_URL, {
      ...sharedOptions,
      dialectOptions: {
        ssl:
          process.env.DB_SSL === 'true'
            ? {
                require: true,
                rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
              }
            : undefined
      }
    });
  }

  return new Sequelize(config.database.name, config.database.user, config.database.password, {
    ...sharedOptions,
    host: config.database.host,
    port: config.database.port,
    dialect: requestedDialect || 'mysql'
  });
}

const sequelize = buildSequelizeInstance();

export default sequelize;
