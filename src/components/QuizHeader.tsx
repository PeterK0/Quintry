import { useState, useEffect } from 'react';

interface QuizHeaderProps {
  markerCount: number;
  onNewQuiz: () => void;
  quizStarted: boolean;
  quizStartTime: number;
}

const QuizHeader = ({
  markerCount,
  onNewQuiz,
  quizStarted,
  quizStartTime,
}: QuizHeaderProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      if (quizStarted && quizStartTime) {
        setElapsedSeconds(Math.floor((Date.now() - quizStartTime) / 1000));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, quizStartTime]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: false });
  };

  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="h-16 bg-slate-800/80 border-b border-slate-700/50 flex items-center justify-between px-8 gap-8 shadow-md backdrop-blur-sm">
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-xl shadow-blue-500/40">
          Q
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-tight">QUINTRY</div>
          <div className="text-slate-400 text-xs">Port Quiz</div>
        </div>
      </div>

      {/* Right: Time and New Quiz Button */}
      <div className="flex items-center gap-4">
        {/* Stats */}
        {quizStarted && (
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <span>{markerCount} Ports</span>
          </div>
        )}

        {/* Time / Stopwatch */}
        <div className="flex items-center gap-2 bg-slate-700/60 px-4 py-2 rounded-lg text-sm text-slate-300 shadow-md border border-slate-600/50">
          {quizStarted ? (
            <>
              <span className="text-blue-400">⏱️</span>
              <span className="font-mono font-bold text-blue-400">{formatElapsedTime(elapsedSeconds)}</span>
            </>
          ) : (
            <>
              <span className="text-blue-400">🕐</span>
              <span className="font-mono">{formatTime(currentTime)}</span>
            </>
          )}
        </div>

        {/* New Quiz Button - Only show during quiz */}
        {quizStarted && (
          <button
            onClick={onNewQuiz}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 hover:scale-105"
          >
            New Quiz
          </button>
        )}
      </div>
    </header>
  );
};

export default QuizHeader;
