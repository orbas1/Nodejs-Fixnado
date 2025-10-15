import app, { initDatabase } from './app.js';
import config from './config/index.js';
import { startBackgroundJobs } from './jobs/index.js';

async function start() {
  try {
    const secretSources = config.secrets?.sources ?? [];
    if (secretSources.length > 0) {
      console.info(
        `Secrets manager synchronised ${secretSources.reduce((acc, source) => acc + source.appliedKeys, 0)} keys across ${secretSources.length} source(s).`
      );
    }
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
