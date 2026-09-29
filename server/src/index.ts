import app from './app';
import { env } from './config/env';
import { connectDB } from './config/db';
import { logger } from './config/logger';

async function main(): Promise<void> {
  await connectDB();
  app.listen(env.port, () => {
    logger.info(`RentalHub API listening on port ${env.port}`, { env: env.nodeEnv });
  });
}

main().catch((err) => {
  logger.error('Failed to start server', { error: err.message });
  process.exit(1);
});
