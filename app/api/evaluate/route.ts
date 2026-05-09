import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

async function getGroqClient(): Promise<Groq> {
  const keys = (process.env.GROQ_API_KEYS || '').split(',').map(k => k.trim()).filter(Boolean);
  for (const key of keys) {
    const client = new Groq({ apiKey: key });
    try {
      await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
      });
      return client;
    } catch (e: any) {
      if (e?.status === 429) continue;
      throw e;
    }
  }
  throw new Error('All Groq keys exhausted');
}

export async function POST(request: Request) {
  try {
    const { transcript, part } = await request.json();
    const prompt = `Evaluate the speaking answer for Part ${part}. Provide scores (0-9) for Fluency, Lexical Resource, Grammatical Range, Pronunciation, and overall band. Also give short feedback. Return JSON: {"fluency": number, "lexical": number, "grammar": number, "pronunciation": number, "overall": number, "feedback": "..."}`;

    const client = await getGroqClient();
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: transcript },
      ],
      response_format: { type: 'json_object' },
    });

    let content = completion.choices[0].message.content || '';
    content = content.replace(/```json|```/g, '').trim();

    return NextResponse.json(JSON.parse(content));
  } catch {
    return NextResponse.json({ overall: 0, feedback: 'Evaluation failed' });
  }
}