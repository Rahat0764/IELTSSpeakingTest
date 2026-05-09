import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// reuse getGroqClient from generate-question or copy
async function getGroqClient(): Promise<Groq> {
  const keys = (process.env.GROQ_API_KEYS || '').split(',').map(k => k.trim()).filter(Boolean);
  for (const key of keys) {
    try {
      const client = new Groq({ apiKey: key });
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
  const { transcript, part } = await request.json();
  const prompt = `You are an IELTS examiner. Evaluate the following speaking answer for Part ${part}. Provide scores (0-9) for Fluency, Lexical Resource, Grammatical Range, Pronunciation, and an overall band. Also give a short feedback. Answer in JSON: {"fluency": 7, "lexical": 6, "grammar": 7, "pronunciation": 6, "overall": 6.5, "feedback": "..."}`;

  try {
    const client = await getGroqClient();
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: transcript },
      ],
      response_format: { type: 'json_object' },
    });
    const content = completion.choices[0].message.content;
    return NextResponse.json(JSON.parse(content || '{}'));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ overall: 0, feedback: 'Evaluation failed' });
  }
}