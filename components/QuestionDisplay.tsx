'use client';

interface Props {
  question: string;
  part: number;
}

export default function QuestionDisplay({ question, part }: Props) {
  return (
    <div className="bg-card p-6 rounded-2xl shadow-lg border border-blue-500/30">
      <span className="text-sm text-blue-400">Part {part}</span>
      <h2 className="text-xl md:text-2xl font-medium mt-2">{question || "Loading..."}</h2>
    </div>
  );
}