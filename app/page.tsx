'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import Avatar from '@/components/Avatar';
import QuestionDisplay from '@/components/QuestionDisplay';
import CameraView from '@/components/CameraView';
import TranscriptBox from '@/components/TranscriptBox';
import ControlPanel from '@/components/ControlPanel';
import ExpressionBar from '@/components/ExpressionBar';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useGroqExam } from '@/hooks/useGroqExam';
import { useSnapshotSender } from '@/hooks/useSnapshotSender';
import { sendLog } from '@/utils/sendLog';

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

  const micActive = !isPaused && examStarted;
  const { transcript, resetTranscript, fillerCount } = useSpeechRecognition(micActive);
  const { generateQuestion, evaluateAnswer } = useGroqExam();
  useSnapshotSender(videoRef, canvasRef, micActive);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(v => v.lang.startsWith('en'));
    if (enVoice) utterance.voice = enVoice;
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => setAvatarSpeaking(true);
    utterance.onend = () => setAvatarSpeaking(false);
    utterance.onerror = () => setAvatarSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    const q = questions[questionIndex];
    if (examStarted && q && !isPaused) speak(q);
  }, [questions, questionIndex, examStarted, isPaused, speak]);

  // sessionStorage persist
  useEffect(() => {
    if (examStarted) {
      sessionStorage.setItem('examState', JSON.stringify({
        examStarted, currentPart, questions, questionIndex, isPaused,
      }));
    }
  }, [examStarted, currentPart, questions, questionIndex, isPaused]);

  useEffect(() => {
    const saved = sessionStorage.getItem('examState');
    if (saved) {
      const s = JSON.parse(saved);
      setExamStarted(s.examStarted);
      setCurrentPart(s.currentPart);
      setQuestions(s.questions || []);
      setQuestionIndex(s.questionIndex || 0);
      setIsPaused(s.isPaused);
    }
  }, []);

  const startExam = async () => {
    setExamStarted(true);
    const qs = await generateQuestion(1, 0);
    if (qs.length > 0) {
      setQuestions(qs);
      setQuestionIndex(0);
      sendLog('Exam started', 'info');
    }
  };

  const handleNext = async () => {
    window.speechSynthesis.cancel();
    const nextIdx = questionIndex + 1;
    if (questions.length > nextIdx) {
      setQuestionIndex(nextIdx);
    } else {
      const newQ = await generateQuestion(currentPart, nextIdx);
      setQuestions(prev => [...prev, ...newQ]);
      setQuestionIndex(nextIdx);
    }
  };

  useEffect(() => {
    const before = () => sessionStorage.removeItem('examState');
    window.addEventListener('beforeunload', before);
    return () => window.removeEventListener('beforeunload', before);
  }, []);

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
        <div className="w-full max-w-4xl flex flex-col gap-6">
          {/* Top row: Avatar + small camera + mic indicator */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Avatar speaking={avatarSpeaking} />
              <div className="flex flex-col items-center gap-1">
                <div className="w-20 h-24 md:w-24 md:h-28">
                  <CameraView
                    videoRef={videoRef}
                    canvasRef={canvasRef}
                    onExpressionUpdate={setExpression}
                  />
                </div>
                {micActive && (
                  <span className="flex items-center gap-1 text-green-400 text-xs mt-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Listening
                  </span>
                )}
              </div>
            </div>
            <ExpressionBar expression={expression} />
          </div>

          {/* Question + transcript + controls */}
          <div className="space-y-6">
            <QuestionDisplay question={questions[questionIndex]} part={currentPart} />
            <TranscriptBox transcript={transcript} fillerCount={fillerCount} />
            <ControlPanel
              isPaused={isPaused}
              onPause={() => {
                setIsPaused(!isPaused);
                if (!isPaused) window.speechSynthesis.pause();
                else window.speechSynthesis.resume();
              }}
              onNext={handleNext}
              onRetake={() => {
                resetTranscript();
                const q = questions[questionIndex];
                if (q) speak(q);
              }}
            />
          </div>
        </div>
      )}
    </main>
  );
}