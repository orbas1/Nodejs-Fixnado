import app, { initDatabase } from './app.js';
import config from './config/index.js';
import { startBackgroundJobs } from './jobs/index.js';

async function start() {
  try {
    await initDatabase(console);
    startBackgroundJobs(console);
    app.listen(config.port, () => {
      console.info(`Fixnado API listening on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

start();
