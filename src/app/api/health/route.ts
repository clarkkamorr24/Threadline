import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json(
      { status: 'ok', database: 'up', timestamp: new Date().toISOString() },
      { status: 200 },
    );
  } catch (error) {
    console.error('[health] Database check failed:', error);
    return NextResponse.json(
      { status: 'error', database: 'down', timestamp: new Date().toISOString() },
      { status: 503 },
    );
  }
}
