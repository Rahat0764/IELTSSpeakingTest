'use client';
import { useState, useRef, useEffect } from 'react';
import Avatar from '@/components/Avatar';
import QuestionDisplay from '@/components/QuestionDisplay';
import CameraView from '@/components/CameraView';
import TranscriptBox from '@/components/TranscriptBox';
import ControlPanel from '@/components/ControlPanel';
import ExpressionBar from '@/components/ExpressionBar';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useGroqExam } from '@/hooks/useGroqExam';
import { useSnapshotSender } from '@/hooks/useSnapshotSender';
import { evaluateFillerWords } from '@/utils/fillerCounter';

export default function Home() {
  const [examStarted, setExamStarted] = useState(false);
  const [currentPart, setCurrentPart] = useState(1);
  const [questions, setQuestions] = useState<string[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [avatarSpeaking, setAvatarSpeaking] = useState(false);
  const [expression, setExpression] = useState({
    angry: 0, confident: 0, nervous: 0, lying: 0
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { transcript, resetTranscript, interim, fillerCount } = useSpeechRecognition(!isPaused && examStarted);
  const { generateQuestion, evaluateAnswer } = useGroqExam();
  useSnapshotSender(videoRef, canvasRef, examStarted && !isPaused);

  // Start exam
  const startExam = async () => {
    setExamStarted(true);
    const qs = await generateQuestion(1, 0);
    setQuestions(qs);
    setQuestionIndex(0);
  };

  const handleNextQuestion = async () => {
    const nextIdx = questionIndex + 1;
    if (questions.length > nextIdx) {
      setQuestionIndex(nextIdx);
    } else {
      // get next question from AI
      const newQ = await generateQuestion(currentPart, nextIdx);
      setQuestions((prev) => [...prev, ...newQ]);
      setQuestionIndex(nextIdx);
    }
  };

  const handlePartComplete = () => {
    if (currentPart < 3) {
      setCurrentPart((p) => p + 1);
      setQuestions([]);
      setQuestionIndex(0);
    } else {
      // exam finished -> evaluate
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      {!examStarted ? (
        <div className="text-center space-y-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            IELTS AI Speaking
          </h1>
          <button onClick={startExam} className="px-8 py-4 bg-accent rounded-full text-xl font-semibold hover:bg-blue-600 transition">
            Start Exam
          </button>
        </div>
      ) : (
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Avatar speaking={avatarSpeaking} />
            <QuestionDisplay question={questions[questionIndex]} part={currentPart} />
            <TranscriptBox transcript={transcript} fillerCount={fillerCount} />
            <ControlPanel
              isPaused={isPaused}
              onPause={() => setIsPaused(!isPaused)}
              onNext={handleNextQuestion}
              onRetake={() => resetTranscript()}
            />
          </div>
          <div className="space-y-4">
            <CameraView
              videoRef={videoRef}
              canvasRef={canvasRef}
              onExpressionUpdate={setExpression}
            />
            <ExpressionBar expression={expression} />
          </div>
        </div>
      )}
    </main>
  );
}