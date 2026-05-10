import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

async function getGroqClient(): Promise<Groq> {
  const keys = (process.env.GROQ_API_KEYS || '').split(',').map(k => k.trim()).filter(Boolean);
  if (keys.length === 0) throw new Error('No API keys');
  for (const key of keys) {
    const client = new Groq({ apiKey: key });
    try {
      await client.chat.completions.create({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: 'ping' }], max_tokens: 1 });
      return client;
    } catch (e: any) { if (e?.status === 429) continue; throw e; }
  }
  throw new Error('All keys exhausted');
}

export async function POST(request: Request) {
  try {
    const { part } = await request.json();
    const prompts: Record<number, string> = {
      1: `You are a real British Council IELTS examiner. Generate **one** Part 1 question that you would ask at the beginning of the speaking test. It should be about familiar topics (home, work, study, hobbies, daily routine). Keep it simple, natural, and friendly. Respond ONLY with JSON: { "questions": ["your question here"] }`,
      2: `You are a real British Council IELTS examiner. Create **one** Part 2 Cue Card. It should start with "Describe ..." and include bullet points (you should say: ...). Write it exactly as it appears on an official IELTS card.
Respond ONLY with JSON: { "questions": ["Describe something you own which is very important to you. You should say: where you got it from, how long you have had it, what you use it for, and explain why it is so important."] }`,
      3: `You are a real British Council IELTS examiner. The test is now in Part 3. Based on the previous topic, generate **one** abstract, opinion‑based or analytical follow‑up question that requires extended discussion. 
Respond ONLY with JSON: { "questions": ["your question here"] }`
    };

    const client = await getGroqClient();
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: prompts[part] || prompts[1] }],
      response_format: { type: 'json_object' },
    });
    let content = completion.choices[0].message.content || '';
    content = content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(content);
    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) throw new Error('Invalid format');
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ questions: ['Let’s begin. Could you tell me your full name and where you are from?'] });
  }
}