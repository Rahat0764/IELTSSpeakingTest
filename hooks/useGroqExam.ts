'use client';
import { sendLog } from '@/utils/sendLog';

export function useGroqExam() {
  const generateQuestion = async (part: number, index: number): Promise<string[]> => {
    try {
      await sendLog(`Requesting question: part=${part}, index=${index}`, 'info');
      const res = await fetch('/api/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ part, index }),
      });
      const data = await res.json();
      await sendLog(`Question received: ${JSON.stringify(data)}`, 'info');
      return data.questions;
    } catch (err: any) {
      await sendLog(`❌ Question fetch failed: ${err.message}`, 'error');
      return ['Sorry, could you repeat that?'];
    }
  };

  const evaluateAnswer = async (transcript: string, part: number) => {
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, part }),
      });
      return res.json();
    } catch {
      return { overall: 0, feedback: 'Evaluation failed' };
    }
  };

  return { generateQuestion, evaluateAnswer };
}