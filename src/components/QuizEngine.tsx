import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  XCircle,
  Timer,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Trophy,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import type { Question } from "@/lib/exam-data";
import { useLocalProgress, type QuizAttempt } from "@/lib/local-progress";

interface QuizEngineProps {
  subjectId: string;
  subjectName: string;
  questions: Question[];
  onComplete?: (attempt: QuizAttempt) => void;
  onExit?: () => void;
}

export function QuizEngine({ subjectId, subjectName, questions, onComplete, onExit }: QuizEngineProps) {
  const { addAttempt } = useLocalProgress();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(questions.length * 60); // 60 seconds per question
  const [startedAt] = useState(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  // Timer effect
  useEffect(() => {
    if (isCompleted) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto-complete when time's up
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCompleted]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const handleAnswerSelect = (index: number) => {
    const newSelectedAnswers = [...selectedAnswers];
    newSelectedAnswers[currentQuestionIndex] = index;
    setSelectedAnswers(newSelectedAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleComplete = () => {
    if (isCompleted) return;

    const completedAt = Date.now();
    let correctCount = 0;

    for (let i = 0; i < totalQuestions; i++) {
      if (selectedAnswers[i] === questions[i].answer) {
        correctCount++;
      }
    }

    const score = Math.round((correctCount / totalQuestions) * 100);
    const timeSpent = Math.round((completedAt - startedAt) / 1000);

    const attempt: QuizAttempt = {
      id: `attempt-${Date.now()}`,
      subjectId,
      subjectName,
      startedAt,
      completedAt,
      score,
      totalQuestions,
      correctAnswers: correctCount,
      timeSpent,
    };

    addAttempt(attempt);
    setIsCompleted(true);
    onComplete?.(attempt);
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setIsCompleted(false);
    setTimeLeft(questions.length * 60);
  };

  const progress = Math.round(((currentQuestionIndex + (selectedAnswers[currentQuestionIndex] !== undefined ? 1 : 0)) / totalQuestions) * 100);

  if (isCompleted) {
    // Results view
    let correctCount = 0;
    for (let i = 0; i < totalQuestions; i++) {
      if (selectedAnswers[i] === questions[i].answer) {
        correctCount++;
      }
    }
    const score = Math.round((correctCount / totalQuestions) * 100);
    const isPassing = score >= 60;

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full border-border/60 bg-card animate-fade-up">
          <CardContent className="pt-8">
            <div className="text-center">
              <div className={`mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full ${isPassing ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
                {isPassing ? <Trophy className="h-16 w-16" /> : <AlertCircle className="h-16 w-16" />}
              </div>

              <h2 className="text-3xl font-bold mb-2">
                {isPassing ? "ممتاز! 🎉" : "يمكنك تحسين نتيجتك!"}
              </h2>

              <div className="my-8 grid grid-cols-2 gap-4">
                <div className="border border-border rounded-2xl bg-muted/50 p-4">
                  <div className="text-4xl font-bold text-primary mb-1">{score}%</div>
                  <div className="text-sm text-muted-foreground">النتيجة</div>
                </div>
                <div className="border border-border rounded-2xl bg-muted/50 p-4">
                  <div className="text-4xl font-bold mb-1">{correctCount} / {totalQuestions}</div>
                  <div className="text-sm text-muted-foreground">إجابات صحيحة</div>
                </div>
                <div className="border border-border rounded-2xl bg-muted/50 p-4">
                  <div className="text-4xl font-bold mb-1">{formatTime(Math.round((Date.now() - startedAt) / 1000))}</div>
                  <div className="text-sm text-muted-foreground">الوقت المستغرق</div>
                </div>
                <div className="border border-border rounded-2xl bg-muted/50 p-4">
                  <div className="text-4xl font-bold mb-1">
                    {score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B" : score >= 60 ? "C" : "D"}
                  </div>
                  <div className="text-sm text-muted-foreground">التقدير</div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button onClick={handleRestart} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  إعادة المحاولة
                </Button>
                {onExit && (
                  <Button variant="outline" onClick={onExit} className="gap-2">
                    <BookOpen className="h-4 w-4" />
                    العودة للمواد
                  </Button>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-border/50 text-left">
                <h3 className="font-bold mb-4 text-lg">مراجعة الإجابات</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {questions.map((q, idx) => {
                    const isCorrect = selectedAnswers[idx] === q.answer;
                    return (
                      <div key={idx} className={`border rounded-xl p-4 ${isCorrect ? 'border-primary/30 bg-primary/5' : 'border-destructive/30 bg-destructive/5'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full ${isCorrect ? 'bg-primary text-primary-foreground' : 'bg-destructive text-destructive-foreground'}`}>
                            {isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-base mb-2">{idx + 1}. {q.q}</div>
                            <div className="text-sm space-y-1">
                              {q.options.map((opt, optIdx) => {
                                let optClass = "text-muted-foreground";
                                if (optIdx === q.answer) {
                                  optClass = "text-primary font-bold";
                                } else if (selectedAnswers[idx] === optIdx) {
                                  optClass = "text-destructive line-through";
                                }
                                return (
                                  <div key={optIdx} className={optClass}>
                                    {optIdx === q.answer ? "✓ " : ""}{" "}
                                    {optIdx === selectedAnswers[idx] && optIdx !== q.answer ? "✗ " : ""}
                                    {opt}
                                  </div>
                                );
                              })}
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground border-t border-border/30 pt-2">
                              💡 {q.explanation}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz view
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress bar and timer */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                سؤال {currentQuestionIndex + 1} من {totalQuestions}
              </span>
              <span className="font-medium">{progress}% مكتمل</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          <div className={`flex items-center gap-2 rounded-full px-4 py-2 border ${timeLeft < 60 ? 'border-destructive/50 bg-destructive/10 text-destructive' : 'border-border bg-muted/50'}`}>
            <Timer className="h-4 w-4" />
            <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Question card */}
        <Card className="mb-8 border-border/60 bg-card animate-fade-up">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl md:text-2xl">{currentQuestion.q}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswerSelect(idx)}
                  className={`w-full text-right p-4 rounded-xl border-2 transition-all ${
                    selectedAnswers[currentQuestionIndex] === idx
                      ? "border-primary bg-primary/10 text-primary-foreground"
                      : "border-border/60 bg-background hover:border-primary/40 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full font-bold text-sm ${
                      selectedAnswers[currentQuestionIndex] === idx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="font-medium">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="gap-2"
          >
            <ChevronRight className="h-4 w-4" />
            السابق
          </Button>

          {currentQuestionIndex < totalQuestions - 1 ? (
            <Button
              onClick={handleNext}
              disabled={selectedAnswers[currentQuestionIndex] === undefined}
              className="gap-2"
            >
              التالي
              <ChevronLeft className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={selectedAnswers[currentQuestionIndex] === undefined}
              className="gap-2"
            >
              إنهاء الاختبار
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
