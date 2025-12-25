import type { QuizResult } from "../types/quiz.types";

interface ResultsScreenProps {
  results: QuizResult[];
  score: number;
  total: number;
  quizDuration: number;
  onTryAgain: () => void;
}

export default function ResultsScreen({
  results,
  score,
  total,
  quizDuration,
  onTryAgain,
}: ResultsScreenProps) {
  const percentage = (score / total) * 100;
  const passed = percentage >= 70;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-slate-100">
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="max-w-4xl w-full space-y-10">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-block px-6 py-2.5 bg-slate-800/70 border border-slate-600/50 rounded-full shadow-lg">
              <span className="text-xs text-slate-400 uppercase tracking-wider">
                Quiz Complete
              </span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-blue-500/40">
                Q
              </div>
              <h1 className="text-6xl font-black tracking-tight">QUINTRY</h1>
            </div>
          </div>

          {/* Score Display */}
          <div className="bg-slate-800/70 border border-slate-700/50 rounded-2xl p-10 shadow-2xl">
            <div className="text-center space-y-4">
              <div className="text-sm text-slate-400 uppercase tracking-wider">
                Final Score
              </div>
              <div className={`text-8xl font-black tracking-tight ${passed ? "text-green-400" : "text-red-400"}`}>
                {score}/{total}
              </div>
              <div className="text-xl text-slate-300">
                {percentage.toFixed(0)}% Accuracy • {formatDuration(quizDuration)}
              </div>
              <div className={`inline-block px-6 py-3 rounded-full text-base font-bold shadow-lg ${
                score === total
                  ? "bg-green-500/20 text-green-400"
                  : passed
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-red-500/20 text-red-400"
              }`}>
                {score === total
                  ? "🎉 PERFECT SCORE"
                  : passed
                  ? "✓ PASSED"
                  : "KEEP PRACTICING"}
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className="bg-slate-800/70 border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-4">
              Answer Breakdown
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result) => (
                <div
                  key={result.letter}
                  className={`flex items-start gap-4 p-5 rounded-xl border-2 shadow-md transition-all duration-200 hover:scale-[1.01] ${
                    result.isCorrect
                      ? "bg-green-500/20 border-green-500/40 hover:shadow-lg hover:shadow-green-500/20"
                      : "bg-red-500/20 border-red-500/40 hover:shadow-lg hover:shadow-red-500/20"
                  }`}
                >
                  <div className={`
                    w-11 h-11 flex items-center justify-center rounded-xl border-2 font-black shadow-lg
                    ${result.isCorrect
                      ? "bg-green-500/20 border-green-500/50 text-green-400"
                      : "bg-red-500/20 border-red-500/50 text-red-400"}
                  `}>
                    {result.letter}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className={`font-medium ${
                      result.isCorrect ? "text-green-400" : "text-red-400"
                    }`}>
                      {result.isCorrect ? "✓" : "✗"} {result.selectedPort || "No answer"}
                    </div>
                    {!result.isCorrect && (
                      <div className="text-sm text-slate-400">
                        Correct: {result.correctPort}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={onTryAgain}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold
                       py-5 px-8 rounded-xl text-base transition-all duration-200 shadow-xl shadow-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/60 hover:scale-[1.02]"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>

      {/* Info Bar */}
      <div className="h-14 bg-slate-800/70 border-t border-slate-700/50 px-8 flex items-center justify-between text-xs shadow-inner">
        <div className="text-slate-400">
          Quiz completed • {new Date().toLocaleTimeString()}
        </div>
        <div className="text-slate-500">
          QUINTRY v0.1.0
        </div>
      </div>
    </div>
  );
}
