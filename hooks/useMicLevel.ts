'use client';
import { useState, useEffect } from 'react';

export function useMicLevel(active: boolean): number {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!active) {
      setLevel(0);
      return;
    }
    // Microphone conflict এড়াতে AudioContext ব্যবহার না করে fake animation level
    const interval = setInterval(() => {
      setLevel(Math.random() * 0.4 + 0.1);
    }, 150);

    return () => clearInterval(interval);
  }, [active]);

  return level;
}