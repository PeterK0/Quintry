import type { QuizHistory } from '../types/quiz.types';
import { invoke } from '@tauri-apps/api/core';

export const saveQuizHistory = async (history: QuizHistory): Promise<void> => {
  try {
    await invoke('save_quiz_history', { history });
  } catch (error) {
    console.error('Error saving quiz history:', error);
  }
};

export const getQuizHistory = async (): Promise<QuizHistory[]> => {
  try {
    const history = await invoke<QuizHistory[]>('get_quiz_history');
    return history;
  } catch (error) {
    console.error('Error loading quiz history:', error);
    return [];
  }
};

export const clearQuizHistory = async (): Promise<void> => {
  try {
    await invoke('clear_quiz_history');
  } catch (error) {
    console.error('Error clearing quiz history:', error);
  }
};

export interface PortStats {
  port: string;
  attempts: number;
  correct: number;
  accuracy: number;
}

export const getPortStats = (history: QuizHistory[]): PortStats[] => {
  const statsMap = new Map<string, { attempts: number; correct: number }>();

  history.forEach(quiz => {
    quiz.results.forEach(result => {
      const existing = statsMap.get(result.port) || { attempts: 0, correct: 0 };
      statsMap.set(result.port, {
        attempts: existing.attempts + 1,
        correct: existing.correct + (result.isCorrect ? 1 : 0),
      });
    });
  });

  return Array.from(statsMap.entries())
    .map(([port, stats]) => ({
      port,
      attempts: stats.attempts,
      correct: stats.correct,
      accuracy: (stats.correct / stats.attempts) * 100,
    }))
    .sort((a, b) => b.attempts - a.attempts);
};

export const getWeakestPorts = (history: QuizHistory[], limit: number = 10): PortStats[] => {
  return getPortStats(history)
    .filter(stat => stat.attempts >= 2 && stat.accuracy < 80) // Only show ports with < 80% accuracy
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, limit);
};

export const getStrongestPorts = (history: QuizHistory[], limit: number = 10): PortStats[] => {
  return getPortStats(history)
    .filter(stat => stat.attempts >= 2 && stat.accuracy >= 81) // Only show ports with >= 81% accuracy
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, limit);
};

export const getAverageScore = (history: QuizHistory[]): number => {
  if (history.length === 0) return 0;
  const totalAccuracy = history.reduce((sum, quiz) => sum + quiz.accuracy, 0);
  return totalAccuracy / history.length;
};

export const getPerformanceByDifficulty = (history: QuizHistory[]): Record<string, { count: number; avgAccuracy: number }> => {
  const stats: Record<string, { total: number; count: number }> = {
    easy: { total: 0, count: 0 },
    normal: { total: 0, count: 0 },
    hard: { total: 0, count: 0 },
  };

  history.forEach(quiz => {
    stats[quiz.difficulty].total += quiz.accuracy;
    stats[quiz.difficulty].count += 1;
  });

  return {
    easy: {
      count: stats.easy.count,
      avgAccuracy: stats.easy.count > 0 ? stats.easy.total / stats.easy.count : 0,
    },
    normal: {
      count: stats.normal.count,
      avgAccuracy: stats.normal.count > 0 ? stats.normal.total / stats.normal.count : 0,
    },
    hard: {
      count: stats.hard.count,
      avgAccuracy: stats.hard.count > 0 ? stats.hard.total / stats.hard.count : 0,
    },
  };
};
