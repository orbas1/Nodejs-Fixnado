import { Sequelize } from 'sequelize';
import config from './index.js';

function buildDialectOptions(dialect) {
  if (dialect === 'postgres') {
    return {
      application_name: process.env.PG_APP_NAME || 'fixnado-api',
      statement_timeout: Number.parseInt(process.env.PG_STATEMENT_TIMEOUT ?? '60000', 10)
    };
  }

  if (dialect === 'mysql') {
    return {
      supportBigNumbers: true,
      bigNumberStrings: true
    };
  }

  return {};
}

function buildSequelizeInstance() {
  const sharedOptions = {
    logging: config.env === 'development' ? console.info : false,
    define: {
      underscored: true,
      freezeTableName: true
    },
    pool: {
      max: Math.max(Number.parseInt(process.env.DB_POOL_MAX ?? '15', 10), 5),
      min: 0,
      idle: Math.max(Number.parseInt(process.env.DB_POOL_IDLE ?? '10000', 10), 1000),
      acquire: Math.max(Number.parseInt(process.env.DB_POOL_ACQUIRE ?? '60000', 10), 1000)
    }
  };

  const requestedDialect = (process.env.DB_DIALECT || config.database.dialect || '').toLowerCase();

  if (config.env === 'test' || requestedDialect === 'sqlite') {
    return new Sequelize('sqlite::memory:', {
      ...sharedOptions,
      dialect: 'sqlite',
      storage: process.env.DB_STORAGE || ':memory:'
    });
  }

  const dialect = requestedDialect || 'postgres';
  const dialectOptions = buildDialectOptions(dialect);

  if (process.env.DB_URL) {
    return new Sequelize(process.env.DB_URL, {
      ...sharedOptions,
      dialect,
      dialectOptions: {
        ...dialectOptions,
        ssl:
          config.database.ssl
            ? {
                require: true,
                rejectUnauthorized: config.database.rejectUnauthorized,
                ca: config.database.caCertificate ? [config.database.caCertificate] : undefined
              }
            : undefined
      }
    });
  }

  return new Sequelize(config.database.name, config.database.user, config.database.password, {
    ...sharedOptions,
    host: config.database.host,
    port: config.database.port,
    dialect,
    dialectOptions: {
      ...dialectOptions,
      ssl:
        config.database.ssl
          ? {
              require: true,
              rejectUnauthorized: config.database.rejectUnauthorized,
              ca: config.database.caCertificate ? [config.database.caCertificate] : undefined
            }
          : undefined
    }
  });
}

const sequelize = buildSequelizeInstance();

export default sequelize;
