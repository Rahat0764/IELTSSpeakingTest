import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, type = 'info' } = body;

    const TOKEN = process.env.LOG_BOT_TOKEN;
    const CHAT_ID = process.env.LOG_CHAT_ID;

    if (!TOKEN || !CHAT_ID) {
      return NextResponse.json({ error: 'Log config missing' }, { status: 500 });
    }

    const text = `📝 *${type.toUpperCase()}*\n${message}\n\n🕒 ${new Date().toISOString()}`;
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: 'Markdown',
      }),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Log failed' }, { status: 500 });
  }
}