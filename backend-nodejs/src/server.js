import app, { initDatabase } from './app.js';
import config from './config/index.js';

async function start() {
  try {
    await initDatabase();
    app.listen(config.port, () => {
      console.log(`Fixnado API listening on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

start();
