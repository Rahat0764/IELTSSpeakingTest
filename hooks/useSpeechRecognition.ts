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
    recognition.lang = 'en-GB'; // IELTS British English

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
        setFillerCount(evaluateFillerWords(fullTranscriptRef.current));
        setError(null);
      }

      // সবসময় ফাইনাল + চলতি টেক্সট দেখানো
      setTranscript(fullTranscriptRef.current);
      setInterim(inter.trim());
    };

    recognition.onerror = (event: any) => {
      console.error('Speech error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow mic permissions.');
      } else {
        setError(`Speech error: ${event.error}`);
      }
    };

    // Unexpected stop হলে আবার চালু
    recognition.onend = () => {
      if (active && recognitionRef.current === recognition) {
        try { recognition.start(); } catch (e) {}
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      setError('Failed to start speech recognition.');
    }

    return () => {
      recognition.onend = null;
      recognition.stop();
    };
  }, [active]);

  const resetTranscript = () => {
    fullTranscriptRef.current = '';
    setTranscript('');
    setInterim('');
    setFillerCount(0);
    setError(null);
  };

  // Final + current interim ফেরত দেয়
  const getFullTranscript = () => (fullTranscriptRef.current + ' ' + interim).trim();

  return { transcript, interim, fillerCount, error, resetTranscript, getFullTranscript };
}