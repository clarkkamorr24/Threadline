import 'server-only';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

/**
 * Prisma client.
 *
 * Since Prisma 7 the connection string no longer lives in `schema.prisma`, so
 * the client is constructed with a driver adapter instead. `PrismaPg` wraps a
 * node-postgres pool, which moves connection pooling into application code
 * rather than query-string parameters on the URL.
 *
 * DATABASE_URL is used here rather than DIRECT_URL: this is the runtime path,
 * and it is the one that should point at a pooler when the deployment has one.
 * DIRECT_URL is reserved for schema operations (see prisma.config.ts).
 */
function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    // Fail at construction rather than on the first query, where the stack
    // trace would point at unrelated application code.
    throw new Error('DATABASE_URL is not set; the database client cannot be created.');
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });
}

/**
 * A single client instance is reused across hot reloads in development.
 * Next.js re-evaluates modules on every change, and a fresh client — with a
 * fresh connection pool — per reload exhausts Postgres connections in minutes.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
