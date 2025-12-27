import { useState, useMemo, useEffect } from 'react';
import type { QuizHistory } from '../types/quiz.types';
import { ask } from '@tauri-apps/plugin-dialog';
import {
  getQuizHistory,
  getWeakestPorts,
  getStrongestPorts,
  getAverageScore,
  getPerformanceByDifficulty,
  clearQuizHistory,
} from '../utils/quizHistory';

export default function StatsPanel() {
  const [history, setHistory] = useState<QuizHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const weakestPorts = useMemo(() => getWeakestPorts(history, 10), [history]);
  const strongestPorts = useMemo(() => getStrongestPorts(history, 10), [history]);
  const avgScore = useMemo(() => getAverageScore(history), [history]);
  const performanceByDifficulty = useMemo(() => getPerformanceByDifficulty(history), [history]);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      const data = await getQuizHistory();
      setHistory(data);
      setLoading(false);
    };
    loadHistory();
  }, []);

  const handleClearHistory = async () => {
    console.log('Clear history button clicked');
    const confirmed = await ask('Are you sure you want to clear all quiz history? This cannot be undone.', {
      title: 'Clear Quiz History',
      kind: 'warning',
    });
    console.log('User confirmation:', confirmed);

    if (confirmed) {
      try {
        console.log('Calling clearQuizHistory...');
        await clearQuizHistory();
        console.log('clearQuizHistory completed');

        // Reload from database to confirm it's cleared
        console.log('Reloading history from database...');
        const data = await getQuizHistory();
        console.log('Loaded history:', data);
        setHistory(data);
        console.log('Quiz history cleared successfully');
      } catch (error) {
        console.error('Failed to clear quiz history:', error);
      }
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12">
        <div className="text-6xl mb-4 animate-pulse">⏳</div>
        <div className="text-slate-400 text-lg">Loading stats...</div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <div className="text-slate-400 text-lg">No quiz history yet</div>
        <div className="text-slate-500 text-sm mt-2">
          Complete some quizzes to see your stats and track your progress
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto space-y-6 pr-2 pb-4">
      {/* Overall Stats */}
      <div className="bg-slate-800/70 border border-slate-700/50 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-slate-100 mb-4">Overall Performance</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-3xl font-black text-blue-400">{history.length}</div>
            <div className="text-xs text-slate-400 mt-1">Quizzes Completed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-green-400">{avgScore.toFixed(1)}%</div>
            <div className="text-xs text-slate-400 mt-1">Average Accuracy</div>
          </div>
        </div>
      </div>

      {/* Performance by Difficulty */}
      <div className="bg-slate-800/70 border border-slate-700/50 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-slate-100 mb-4">Performance by Difficulty</h3>
        <div className="space-y-3">
          {(['easy', 'normal', 'hard'] as const).map((diff) => {
            const stats = performanceByDifficulty[diff];
            const icon = diff === 'easy' ? '👶' : diff === 'normal' ? '👍' : '🥵';
            return (
              <div key={diff} className="bg-slate-900/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{icon}</span>
                    <span className="text-sm font-bold text-slate-200 capitalize">{diff}</span>
                  </div>
                  <span className="text-xs text-slate-400">{stats.count} quizzes</span>
                </div>
                {stats.count > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-800/50 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          stats.avgAccuracy >= 80
                            ? 'bg-green-500'
                            : stats.avgAccuracy >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${stats.avgAccuracy}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-200 min-w-[45px] text-right">
                      {stats.avgAccuracy.toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Weakest Ports */}
      {weakestPorts.length > 0 && (
        <div className="bg-slate-800/70 border border-slate-700/50 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
            <span>📉</span>
            <span>Weakest Ports (Need Practice)</span>
          </h3>
          <div className="space-y-2">
            {weakestPorts.map((stat, index) => (
              <div key={`weak-${index}-${stat.port}`} className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-sm font-bold text-red-400 min-w-[20px]">#{index + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-200 truncate">{stat.port}</div>
                      <div className="text-xs text-slate-400">
                        {stat.correct}/{stat.attempts} correct
                      </div>
                    </div>
                  </div>
                  <div className="text-lg font-black text-red-400 ml-3">
                    {stat.accuracy.toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strongest Ports */}
      {strongestPorts.length > 0 && (
        <div className="bg-slate-800/70 border border-slate-700/50 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
            <span>📈</span>
            <span>Strongest Ports (Mastered)</span>
          </h3>
          <div className="space-y-2">
            {strongestPorts.map((stat, index) => (
              <div key={`strong-${index}-${stat.port}`} className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-sm font-bold text-green-400 min-w-[20px]">#{index + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-200 truncate">{stat.port}</div>
                      <div className="text-xs text-slate-400">
                        {stat.correct}/{stat.attempts} correct
                      </div>
                    </div>
                  </div>
                  <div className="text-lg font-black text-green-400 ml-3">
                    {stat.accuracy.toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Quizzes */}
      <div className="bg-slate-800/70 border border-slate-700/50 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-slate-100 mb-4">Recent Quizzes</h3>
        <div className="space-y-2">
          {history
            .slice()
            .reverse()
            .slice(0, 10)
            .map((quiz) => (
              <div
                key={quiz.id}
                className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-slate-200">
                        {quiz.score}/{quiz.total}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        quiz.accuracy >= 80
                          ? 'bg-green-500/20 text-green-400'
                          : quiz.accuracy >= 60
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {quiz.accuracy.toFixed(0)}%
                      </span>
                      <span className="text-xs text-slate-400 capitalize">
                        {quiz.difficulty}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatDate(quiz.date)} • {formatDuration(quiz.duration)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Clear History Button */}
      <div className="pt-4 border-t border-slate-700/50">
        <button
          onClick={handleClearHistory}
          className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold py-3 px-4 rounded-xl text-sm transition-all duration-200 border border-red-500/30"
        >
          Clear All History
        </button>
      </div>
    </div>
  );
}
