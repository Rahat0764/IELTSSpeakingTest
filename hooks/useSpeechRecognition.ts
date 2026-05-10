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
    recognition.lang = 'en-GB'; // British English for IELTS

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

      // Always show current full transcript + interim
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

    // Restart if it stops unexpectedly (except manual stop)
    recognition.onend = () => {
      if (active && recognitionRef.current === recognition) {
        try { recognition.start(); } catch (e) {}
      }
    };

    recognition.start();
    recognitionRef.current = recognition;

    return () => {
      recognition.onend = null; // prevent restart after unmount
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

  const getFullTranscript = () => fullTranscriptRef.current;
  return { transcript, interim, fillerCount, error, resetTranscript, getFullTranscript };
}