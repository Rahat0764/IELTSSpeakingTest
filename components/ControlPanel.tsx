'use client';

interface Props {
  isPaused: boolean;
  onPause: () => void;
  onNext: () => void;
  onRetake: () => void;
}

export default function ControlPanel({ isPaused, onPause, onNext, onRetake }: Props) {
  return (
    <div className="flex gap-3 flex-wrap justify-center">
      <button onClick={onPause} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">
        {isPaused ? '▶ Resume' : '⏸ Pause'}
      </button>
      <button onClick={onRetake} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">
        🔄 Retake
      </button>
      <button onClick={onNext} className="px-4 py-2 bg-accent rounded-lg hover:bg-blue-600">
        Next ➡
      </button>
    </div>
  );
}