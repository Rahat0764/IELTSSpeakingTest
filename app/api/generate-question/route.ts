import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

async function getGroqClient(): Promise<Groq> {
  const keys = (process.env.GROQ_API_KEYS || '').split(',').map(k => k.trim()).filter(Boolean);
  if (keys.length === 0) throw new Error('No API keys');

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
  throw new Error('All keys exhausted');
}

export async function POST(request: Request) {
  try {
    const { part, index } = await request.json();
    const prompts: Record<number, string> = {
      1: `You are an IELTS examiner. Generate a single, natural, friendly Part 1 question (e.g. about home, work, hobbies). Return JSON: { "questions": ["question text"] }`,
      2: `You are an IELTS examiner. Generate 1 Part 2 cue card topic. Return JSON: { "questions": ["Describe something you own which is very important to you. You should say: where you got it from, how long you have had it, what you use it for, and explain why it is important to you."] }`,
      3: `You are an IELTS examiner. Based on the previous topic, ask 1 Part 3 abstract discussion question. Return JSON: { "questions": ["question text"] }`,
    };

    const client = await getGroqClient();
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: prompts[part] || prompts[1] }],
      response_format: { type: 'json_object' },
    });

    let content = completion.choices[0].message.content || '';
    // Remove possible markdown code fences
    content = content.replace(/```json|```/g, '').trim();

    const parsed = JSON.parse(content);
    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error('Invalid questions format');
    }
    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error('generate-question error:', err.message);
    return NextResponse.json({ questions: ['Could you tell me about your hometown?'] });
  }
}