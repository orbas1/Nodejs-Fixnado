import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { sequelize } from './models/index.js';

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

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Fixnado API' });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export async function initDatabase() {
  await sequelize.authenticate();
}

export default app;
