'use client';
import { useEffect, useState } from 'react';

interface Props {
  transcript: string;
  fillerCount: number;
}

export default function TranscriptBox({ transcript, fillerCount }: Props) {
  return (
    <div className="bg-card p-4 rounded-xl border border-blue-500/20">
      <div className="flex justify-between">
        <span className="text-sm text-blue-300">Your Answer</span>
        <span className="text-xs bg-red-600 px-2 py-0.5 rounded-full">Fillers: {fillerCount}</span>
      </div>
      <p className="mt-2 min-h-[60px] text-gray-200">
        {transcript || "Speak now..."}
      </p>
    </div>
  );
}