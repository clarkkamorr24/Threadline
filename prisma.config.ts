import { config as loadEnv } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

loadEnv();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Schema operations (migrate, studio, db execute) need a direct, non-pooled
    // connection, so DIRECT_URL wins when it is set. Most deployments have no
    // pooler and the two URLs are identical, so falling back to DATABASE_URL
    // keeps DIRECT_URL optional rather than making it required everywhere.
    //
    // `process.env` is read directly for the first branch: `env()` throws on a
    // missing variable, which would defeat the fallback. The `env()` call on the
    // second branch is what enforces that at least one URL is configured.
    url: process.env.DIRECT_URL ?? env('DATABASE_URL'),
  },
});
