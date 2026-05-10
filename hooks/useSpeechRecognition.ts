'use client';
import { useState, useEffect, useRef } from 'react';
import { evaluateFillerWords } from '@/utils/fillerCounter';

export function useSpeechRecognition(active: boolean) {
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [fillerCount, setFillerCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const fullTranscriptRef = useRef('');

  useEffect(() => {
    if (!active) {
      recognitionRef.current?.stop();
      setError(null);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser.');
      return;
    }

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
        setError(null);
      }
      setInterim(inter.trim());
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow mic permissions.');
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
      recognition.stop();
    };

    recognition.start();
    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [active]);

  const resetTranscript = () => {
    fullTranscriptRef.current = '';
    setTranscript('');
    setFillerCount(0);
    setError(null);
  };

  const getFullTranscript = () => fullTranscriptRef.current;
  return { transcript, interim, fillerCount, error, resetTranscript, getFullTranscript };
}