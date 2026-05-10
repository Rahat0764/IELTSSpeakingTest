import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (!origin || !host || !origin.includes(host)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Redis check for pause
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL!,
      token: process.env.UPSTASH_REDIS_TOKEN!,
    });
    const paused = await redis.get('snapshot_paused');
    if (paused === 'true') {
      return NextResponse.json({ message: 'Snapshots paused' });
    }

    const formData = await request.formData();
    const file = formData.get('screenshot') as Blob;
    if (!file) {
      return NextResponse.json({ error: 'No file' }, { status: 400 });
    }

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      return NextResponse.json({ error: 'Config missing' }, { status: 500 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const telegramForm = new FormData();
    telegramForm.append('chat_id', TELEGRAM_CHAT_ID);
    telegramForm.append('photo', new Blob([buffer], { type: 'image/jpeg' }), 'snapshot.jpg');

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      body: telegramForm,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}