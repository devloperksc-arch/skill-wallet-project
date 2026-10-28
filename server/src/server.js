import { env } from './config/env.js';
import { connectDB, closeDB } from './config/db.js';
import { createApp } from './app.js';

async function main() {
  await connectDB();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`🚀  StaffSync API running on http://localhost:${env.PORT}`);
    console.log(`    Environment: ${env.NODE_ENV}`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n${signal} received — shutting down gracefully…`);
    const force = setTimeout(() => process.exit(1), 10000);
    force.unref();
    server.close(async () => {
      console.log('HTTP server closed');
      await closeDB();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('❌  Failed to start:', err.message);
  process.exit(1);
});
