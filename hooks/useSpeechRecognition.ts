'use client';
import { useState, useEffect, useRef } from 'react';
import { evaluateFillerWords } from '@/utils/fillerCounter';

export function useSpeechRecognition(active: boolean) {
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [fillerCount, setFillerCount] = useState(0);
  const recognitionRef = useRef<any>(null);

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
      let finalTranscript = '';
      let inter = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
        } else {
          inter += result[0].transcript + ' ';
        }
      }
      setTranscript((prev) => prev + finalTranscript);
      setInterim(inter.trim());
      setFillerCount(evaluateFillerWords(transcript + finalTranscript));
    };

    recognition.start();
    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [active, transcript]);

  const resetTranscript = () => {
    setTranscript('');
    setFillerCount(0);
  };

  return { transcript, interim, fillerCount, resetTranscript };
}
