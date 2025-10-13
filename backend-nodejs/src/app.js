import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { sequelize } from './models/index.js';
import config from './config/index.js';

const app = express();

app.disable('x-powered-by');
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);
app.use(cors());
app.use(express.json());
app.use(morgan('tiny'));

app.set('dashboards:exportRowLimit', config.dashboards?.exportRowLimit ?? 5000);
app.set('dashboards:defaultTimezone', config.dashboards?.defaultTimezone ?? 'Europe/London');

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Fixnado API' });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export async function initDatabase(logger = console) {
  await sequelize.authenticate();

  if (sequelize.getDialect() === 'postgres') {
    try {
      await sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis');
      await sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis_topology');
      await sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

      const [rows] = await sequelize.query(
        "SELECT installed_version FROM pg_available_extensions WHERE name = 'postgis' AND installed_version IS NOT NULL"
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error('PostGIS extension not installed for the current database user');
      }

      logger?.info?.('PostGIS extension verified', {
        postgisVersion: rows[0].installed_version
      });
    } catch (error) {
      logger?.error?.('PostGIS verification failed', {
        message: error.message
      });
      throw error;
    }
  }
}

export default app;
