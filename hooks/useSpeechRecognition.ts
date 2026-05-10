'use client';
import { useState, useEffect, useRef } from 'react';
import { evaluateFillerWords } from '@/utils/fillerCounter';

export function useSpeechRecognition(active: boolean) {
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [fillerCount, setFillerCount] = useState(0);
  const recognitionRef = useRef<any>(null);
  const fullTranscriptRef = useRef('');

  useEffect(() => {
    if (!active) {
      recognitionRef.current?.stop();
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let final = '';
      let inter = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) final += r[0].transcript + ' ';
        else inter += r[0].transcript + ' ';
      }
      if (final) {
        fullTranscriptRef.current += final;
        setTranscript(fullTranscriptRef.current);
        setFillerCount(evaluateFillerWords(fullTranscriptRef.current));
      }
      setInterim(inter.trim());
    };
    recognition.start();
    recognitionRef.current = recognition;
    return () => recognition.stop();
  }, [active]);

  const resetTranscript = () => {
    fullTranscriptRef.current = '';
    setTranscript('');
    setFillerCount(0);
  };

  const getFullTranscript = () => fullTranscriptRef.current;
  return { transcript, interim, fillerCount, resetTranscript, getFullTranscript };
}