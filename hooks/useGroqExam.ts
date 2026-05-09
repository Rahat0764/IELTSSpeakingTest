'use client';
import { useState } from 'react';

export function useGroqExam() {
  const generateQuestion = async (part: number, index: number): Promise<string[]> => {
    const res = await fetch('/api/generate-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ part, index }),
    });
    const data = await res.json();
    return data.questions;
  };

  const evaluateAnswer = async (transcript: string, part: number) => {
    const res = await fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, part }),
    });
    return res.json();
  };

  return { generateQuestion, evaluateAnswer };
}