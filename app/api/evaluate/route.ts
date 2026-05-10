import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

async function getGroqClient(): Promise<Groq> {
  const keys = (process.env.GROQ_API_KEYS || '').split(',').map(k => k.trim()).filter(Boolean);
  for (const key of keys) {
    const client = new Groq({ apiKey: key });
    try { await client.chat.completions.create({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: 'ping' }], max_tokens: 1 }); return client; }
    catch (e: any) { if (e?.status === 429) continue; throw e; }
  }
  throw new Error('All keys exhausted');
}

export async function POST(request: Request) {
  try {
    const { transcript, part } = await request.json();
    const prompt = `You are an experienced IELTS examiner. Evaluate the following speaking answer for Part ${part}.

Provide the analysis STRICTLY in JSON format with exactly these fields:

{
  "fluency": number (0-9),
  "lexical_resource": number (0-9),
  "grammatical_range": number (0-9),
  "pronunciation": number (0-9),
  "overall_band": number (0-9),
  "grammar_mistakes": ["list of specific grammar errors found in the answer"],
  "pronunciation_issues": ["list of pronunciation or accent problems, e.g. L/R confusion, flat intonation, missing stress"],
  "improved_answer_example": "Rewrite the answer as a Band 8-9 candidate would say it, using richer vocabulary and complex grammar naturally.",
  "feedback": "A short, encouraging overall comment about what the candidate did well and how to improve, in the style of a real examiner."
}

Candidate's answer: "${transcript}"`;

    const client = await getGroqClient();
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: prompt }],
      response_format: { type: 'json_object' },
    });
    let content = completion.choices[0].message.content || '';
    content = content.replace(/```json|```/g, '').trim();
    return NextResponse.json(JSON.parse(content));
  } catch {
    return NextResponse.json({
      fluency: 0, lexical_resource: 0, grammatical_range: 0, pronunciation: 0, overall_band: 0,
      grammar_mistakes: [], pronunciation_issues: [], improved_answer_example: '', feedback: 'Evaluation failed.'
    });
  }
}