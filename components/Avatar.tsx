'use client';
import { useEffect, useRef } from 'react';

interface Props {
  speaking: boolean;
}

export default function Avatar({ speaking }: Props) {
  const mouthRef = useRef<SVGEllipseElement>(null); // ← ঠিক হলো

  useEffect(() => {
    if (speaking) {
      const interval = setInterval(() => {
        if (mouthRef.current) {
          mouthRef.current.setAttribute('ry', `${5 + Math.random() * 10}`);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [speaking]);

  return (
    <div className="flex justify-center">
      <svg viewBox="0 0 200 200" className="w-40 h-40 md:w-48 md:h-48 drop-shadow-xl">
        <circle cx="100" cy="100" r="90" fill="#2a2a2a" stroke="#3b82f6" strokeWidth="3" />
        {/* eyes */}
        <circle cx="70" cy="80" r="12" fill="white" />
        <circle cx="130" cy="80" r="12" fill="white" />
        <circle cx="70" cy="80" r="7" fill="#0f0f0f" />
        <circle cx="130" cy="80" r="7" fill="#0f0f0f" />
        {/* mouth */}
        <ellipse cx="100" cy="120" rx="25" ry="8" fill="#3b82f6" ref={mouthRef} />
      </svg>
    </div>
  );
}