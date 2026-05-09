'use client';

interface Props {
  expression: {
    angry: number;
    confident: number;
    nervous: number;
    lying: number;
  };
}

export default function ExpressionBar({ expression }: Props) {
  const bars = [
    { label: 'Angry', value: expression.angry, color: 'bg-red-500' },
    { label: 'Confident', value: expression.confident, color: 'bg-green-500' },
    { label: 'Nervous', value: expression.nervous, color: 'bg-yellow-500' },
    { label: 'Lying', value: expression.lying, color: 'bg-purple-500' },
  ];

  return (
    <div className="bg-card p-4 rounded-xl space-y-3 border border-blue-500/20">
      <p className="text-sm text-blue-300">Emotion Detection</p>
      {bars.map((bar) => (
        <div key={bar.label} className="flex items-center gap-2">
          <span className="w-20 text-xs">{bar.label}</span>
          <div className="flex-1 bg-gray-700 h-2 rounded-full overflow-hidden">
            <div className={`h-full ${bar.color}`} style={{ width: `${Math.min(bar.value, 100)}%` }} />
          </div>
          <span className="text-xs w-10">{Math.round(bar.value)}%</span>
        </div>
      ))}
    </div>
  );
}