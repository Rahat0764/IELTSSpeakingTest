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
import { useMicLevel } from '@/hooks/useMicLevel';
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
  const { generateQuestion } = useGroqExam();
  useSnapshotSender(videoRef, canvasRef, micActive);
  const micLevel = useMicLevel(micActive);

  // Draggable camera state
  const [camPos, setCamPos] = useState({ x: 20, y: 20 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const camRef = useRef<HTMLDivElement>(null);

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

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    dragStart.current = { x: e.clientX - camPos.x, y: e.clientY - camPos.y };
  };
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setDragging(true);
    const touch = e.touches[0];
    dragStart.current = { x: touch.clientX - camPos.x, y: touch.clientY - camPos.y };
  };
  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging) return;
    setCamPos({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };
  const handleTouchMove = (e: TouchEvent) => {
    if (!dragging) return;
    const touch = e.touches[0];
    setCamPos({ x: touch.clientX - dragStart.current.x, y: touch.clientY - dragStart.current.y });
  };
  const stopDrag = () => setDragging(false);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', stopDrag);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', stopDrag);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', stopDrag);
    };
  }, [dragging]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      {/* Draggable small camera */}
      {examStarted && (
        <div
          ref={camRef}
          className="absolute z-20 w-24 h-32 md:w-28 md:h-36 cursor-grab active:cursor-grabbing select-none"
          style={{ left: camPos.x, top: camPos.y }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <CameraView
            videoRef={videoRef}
            canvasRef={canvasRef}
            onExpressionUpdate={setExpression}
          />
        </div>
      )}

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
        <div className="w-full max-w-4xl flex flex-col items-center gap-6">
          {/* Avatar centered */}
          <Avatar speaking={avatarSpeaking} />

          {/* Question */}
          <QuestionDisplay question={questions[questionIndex]} part={currentPart} />

          {/* Transcript + mic level + filler */}
          <TranscriptBox transcript={transcript} fillerCount={fillerCount} />
          {micActive && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-75"
                  style={{ width: `${Math.min(micLevel * 100, 100)}%` }}
                />
              </span>
              <span>Listening</span>
            </div>
          )}

          {/* Controls */}
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

          {/* Emotion Detection at the bottom */}
          <ExpressionBar expression={expression} />
        </div>
      )}
    </main>
  );
}