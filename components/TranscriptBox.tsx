'use client';

interface Props {
  transcript: string;
  interim: string;
  fillerCount: number;
}

export default function TranscriptBox({ transcript, interim, fillerCount }: Props) {
  return (
    <div className="bg-card/80 backdrop-blur-md p-5 rounded-xl border border-blue-500/20 shadow-inner transition-all w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-blue-300 font-medium">Your Answer</span>
        <span className="text-xs bg-red-600/80 px-2 py-0.5 rounded-full text-white">Fillers: {fillerCount}</span>
      </div>
      <p className="min-h-[60px] text-gray-200 text-lg leading-relaxed whitespace-pre-wrap">
        <span>{transcript}</span>
        <span className="text-gray-400 italic">{interim}</span>
        {!(transcript || interim) && <span className="text-gray-500 italic">Speak now...</span>}
      </p>
    </div>
  );
}