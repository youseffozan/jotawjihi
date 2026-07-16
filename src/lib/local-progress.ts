// Local-first progress backup and sync system
import { useEffect, useState } from "react";

export interface QuizAttempt {
  id: string;
  subjectId: string;
  subjectName: string;
  startedAt: number;
  completedAt: number;
  score: number; // percentage 0-100
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number; // in seconds
}

export interface SubjectProgress {
  subjectId: string;
  bestScore: number;
  totalAttempts: number;
  totalQuestionsAnswered: number;
  lastAttemptedAt: number;
}

export interface UserProgress {
  overallAverage: number;
  totalExamsCompleted: number;
  subjectProgress: Record<string, SubjectProgress>;
  attempts: QuizAttempt[];
  lastSyncedAt?: number;
}

const LOCAL_STORAGE_KEY = "jo-tawjihi-progress-v1";

// Initialize default progress
export const getDefaultProgress = (): UserProgress => ({
  overallAverage: 0,
  totalExamsCompleted: 0,
  subjectProgress: {},
  attempts: [],
});

// Load progress from localStorage
export const loadLocalProgress = (): UserProgress => {
  if (typeof window === "undefined") return getDefaultProgress();
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) return getDefaultProgress();
    return JSON.parse(stored) as UserProgress;
  } catch {
    return getDefaultProgress();
  }
};

// Save progress to localStorage
export const saveLocalProgress = (progress: UserProgress): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error("Failed to save local progress:", e);
  }
};

// Add a new attempt and update progress
export const addQuizAttempt = (attempt: QuizAttempt): UserProgress => {
  const progress = loadLocalProgress();
  const newAttempts = [attempt, ...progress.attempts].slice(0, 100); // Keep last 100 attempts

  // Update subject progress
  const subjectProgress = progress.subjectProgress[attempt.subjectId] || {
    subjectId: attempt.subjectId,
    bestScore: 0,
    totalAttempts: 0,
    totalQuestionsAnswered: 0,
    lastAttemptedAt: 0,
  };

  const newSubjectProgress: SubjectProgress = {
    ...subjectProgress,
    bestScore: Math.max(subjectProgress.bestScore, attempt.score),
    totalAttempts: subjectProgress.totalAttempts + 1,
    totalQuestionsAnswered: subjectProgress.totalQuestionsAnswered + attempt.totalQuestions,
    lastAttemptedAt: attempt.completedAt,
  };

  // Recalculate overall average
  const allBestScores = Object.values({
    ...progress.subjectProgress,
    [attempt.subjectId]: newSubjectProgress,
  }).map((sp) => sp.bestScore);

  const overallAverage = allBestScores.length > 0
    ? allBestScores.reduce((sum, score) => sum + score, 0) / allBestScores.length
    : 0;

  const newProgress: UserProgress = {
    ...progress,
    overallAverage,
    totalExamsCompleted: progress.totalExamsCompleted + 1,
    subjectProgress: {
      ...progress.subjectProgress,
      [attempt.subjectId]: newSubjectProgress,
    },
    attempts: newAttempts,
    lastSyncedAt: Date.now(),
  };

  saveLocalProgress(newProgress);
  return newProgress;
};

// React hook for accessing progress
export function useLocalProgress() {
  const [progress, setProgress] = useState<UserProgress>(() => loadLocalProgress());

  useEffect(() => {
    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY && e.newValue) {
        try {
          setProgress(JSON.parse(e.newValue) as UserProgress);
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const addAttempt = (attempt: QuizAttempt) => {
    const newProgress = addQuizAttempt(attempt);
    setProgress(newProgress);
  };

  const resetProgress = () => {
    const defaultProgress = getDefaultProgress();
    saveLocalProgress(defaultProgress);
    setProgress(defaultProgress);
  };

  return {
    progress,
    addAttempt,
    resetProgress,
  };
}
