'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import Avatar from '@/components/Avatar';
import QuestionDisplay from '@/components/QuestionDisplay';
import CameraView from '@/components/CameraView';
import TranscriptBox from '@/components/TranscriptBox';
import ControlPanel from '@/components/ControlPanel';
import ExpressionBar from '@/components/ExpressionBar';
import ScoreReport from '@/components/ScoreReport';
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
  const [expression, setExpression] = useState({ angry: 0, confident: 0, nervous: 0, lying: 0 });
  const [examFinished, setExamFinished] = useState(false);
  const [scoreReport, setScoreReport] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const micActive = !isPaused && examStarted && !examFinished;
  const { transcript, resetTranscript, fillerCount, getFullTranscript } = useSpeechRecognition(micActive);
  const { generateQuestion, evaluateAnswer } = useGroqExam();
  useSnapshotSender(videoRef, canvasRef, micActive);
  const micLevel = useMicLevel(micActive);

  const [camPos, setCamPos] = useState({ x: 20, y: 20 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const speak = useCallback((text: string) => {
    if (!text) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    const url = `/api/tts?text=${encodeURIComponent(text)}&lang=en`;
    const audio = new Audio(url);
    audio.onplay = () => setAvatarSpeaking(true);
    audio.onended = () => setAvatarSpeaking(false);
    audio.onerror = () => setAvatarSpeaking(false);
    audio.play();
    audioRef.current = audio;
  }, []);

  useEffect(() => {
    const q = questions[questionIndex];
    if (examStarted && !examFinished && q && !isPaused) speak(q);
  }, [questions, questionIndex, examStarted, examFinished, isPaused, speak]);

  // sessionStorage
  useEffect(() => {
    if (examStarted) sessionStorage.setItem('examState', JSON.stringify({ examStarted, currentPart, questions, questionIndex, isPaused }));
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
    if (qs.length > 0) { setQuestions(qs); setQuestionIndex(0); sendLog('Exam started', 'info'); }
  };

  // Autosubmit silence detection
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!micActive || !transcript.trim()) return;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(async () => {
      const full = getFullTranscript();
      if (!full.trim()) return;
      await evaluateAnswer(full, currentPart);
      sendLog(`Answer submitted for Part ${currentPart}.`, 'info');
      resetTranscript();

      // Determine next question index and part
      const nextIdx = questionIndex + 1;
      if (questions.length > nextIdx) {
        setQuestionIndex(nextIdx);
      } else {
        // need new questions
        if (currentPart < 3) {
          const newQ = await generateQuestion(currentPart, nextIdx);
          if (newQ.length) {
            // New questions appended
            setQuestions(prev => {
              const updated = [...prev, ...newQ];
              // Set index to last added
              setQuestionIndex(updated.length - 1);
              return updated;
            });
          }
        } else {
          // Exam finish – evaluate last answer and show report
          const finalEval = await evaluateAnswer(full, currentPart);
          setScoreReport(finalEval);
          setExamFinished(true);
          setIsPaused(true);
          sendLog('Exam finished.', 'info');
        }
      }
    }, 3000);
    return () => { if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current); };
  }, [transcript, micActive]);

  const handleNext = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    resetTranscript();
    const nextIdx = questionIndex + 1;
    if (questions.length > nextIdx) {
      setQuestionIndex(nextIdx);
    } else {
      generateQuestion(currentPart, nextIdx).then(newQ => {
        setQuestions(prev => {
          const updated = [...prev, ...newQ];
          setQuestionIndex(updated.length - 1);
          return updated;
        });
      });
    }
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => { e.preventDefault(); setDragging(true); dragStart.current = { x: e.clientX - camPos.x, y: e.clientY - camPos.y }; };
  const handleTouchStart = (e: React.TouchEvent) => { e.preventDefault(); setDragging(true); const t = e.touches[0]; dragStart.current = { x: t.clientX - camPos.x, y: t.clientY - camPos.y }; };
  const handleMouseMove = (e: MouseEvent) => { if (!dragging) return; setCamPos({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }); };
  const handleTouchMove = (e: TouchEvent) => { if (!dragging) return; const t = e.touches[0]; setCamPos({ x: t.clientX - dragStart.current.x, y: t.clientY - dragStart.current.y }); };
  const stopDrag = () => setDragging(false);
  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', stopDrag);
      window.addEventListener('touchmove', handleTouchMove, { passive: false }); window.addEventListener('touchend', stopDrag);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchmove', handleTouchMove); window.removeEventListener('touchend', stopDrag);
    };
  }, [dragging]);

  if (examFinished) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <ScoreReport report={scoreReport} />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      {examStarted && (
        <div className="absolute z-20 w-24 h-32 md:w-28 md:h-36 cursor-grab active:cursor-grabbing select-none"
          style={{ left: camPos.x, top: camPos.y }}
          onMouseDown={handleMouseDown} onTouchStart={handleTouchStart}>
          <CameraView videoRef={videoRef} canvasRef={canvasRef} onExpressionUpdate={setExpression} />
        </div>
      )}
      {!examStarted ? (
        <div className="text-center space-y-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">IELTS AI Speaking</h1>
          <button onClick={startExam} className="px-8 py-4 bg-accent rounded-full text-xl font-semibold hover:bg-blue-600 transition">Start Exam</button>
        </div>
      ) : (
        <div className="w-full max-w-4xl flex flex-col items-center gap-6">
          <Avatar speaking={avatarSpeaking} />
          <QuestionDisplay question={questions[questionIndex]} part={currentPart} />
          <TranscriptBox transcript={transcript} fillerCount={fillerCount} />
          {micActive && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"/><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"/></span>
              <span className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-green-500 transition-all duration-75" style={{ width: `${Math.min(micLevel*100,100)}%` }}/></span>
              <span>Listening</span>
            </div>
          )}
          <ControlPanel
            isPaused={isPaused}
            onPause={() => setIsPaused(!isPaused)}
            onNext={handleNext}
            onRetake={() => { resetTranscript(); const q = questions[questionIndex]; if (q) speak(q); }}
          />
          <ExpressionBar expression={expression} />
        </div>
      )}
    </main>
  );
}