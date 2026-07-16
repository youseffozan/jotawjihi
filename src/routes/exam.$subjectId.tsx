import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Timer, CheckCircle2, XCircle, Trophy, ArrowLeft, ArrowRight, Home, Loader2, Flag, AlertTriangle } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { MathText } from "@/components/MathText";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Subject = { id: string; name_ar: string; name_en: string; icon: string | null };
type Question = { id: string; question: string; options: string[]; correct_answer: number; explanation: string | null; passage: string | null; language: string };
type ExamMeta = { id: string; name_ar: string; duration_seconds: number; total_score: number };

type Search = { examId?: string; bank?: string; units?: string; count?: string };

export const Route = createFileRoute("/exam/$subjectId")({
  validateSearch: (raw: Record<string, unknown>): Search => ({
    examId: typeof raw.examId === "string" ? raw.examId : undefined,
    bank: typeof raw.bank === "string" ? raw.bank : undefined,
    units: typeof raw.units === "string" ? raw.units : undefined,
    count: typeof raw.count === "string" ? raw.count : undefined,
  }),
  component: ExamPage,
});

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ExamPage() {
  const { subjectId } = Route.useParams();
  const search = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [examMeta, setExamMeta] = useState<ExamMeta | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [saved, setSaved] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const storageKey = `exam:progress:${user?.id ?? "anon"}:${subjectId}:${search.examId ?? search.bank ?? search.units ?? "all"}`;

  // Restore in-progress attempt from localStorage
  useEffect(() => {
    if (loading || submitted) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as { answers?: Record<number, number>; current?: number; seconds?: number; flagged?: number[] };
      if (saved.answers) setAnswers(saved.answers);
      if (typeof saved.current === "number") setCurrent(saved.current);
      if (typeof saved.seconds === "number") setSeconds(saved.seconds);
      if (Array.isArray(saved.flagged)) setFlagged(new Set(saved.flagged));
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Persist progress
  useEffect(() => {
    if (loading || submitted) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ answers, current, seconds, flagged: [...flagged] }));
    } catch { /* ignore */ }
  }, [answers, current, seconds, flagged, loading, submitted, storageKey]);

  // Clear on submit
  useEffect(() => {
    if (submitted) { try { localStorage.removeItem(storageKey); } catch { /* ignore */ } }
  }, [submitted, storageKey]);

  // Warn before leaving
  useEffect(() => {
    if (loading || submitted) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [loading, submitted]);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.from("subjects").select("id,name_ar,name_en,icon").eq("id", subjectId).maybeSingle();
      if (!s) { navigate({ to: "/" }); return; }
      setSubject(s as Subject);

      let parsed: Question[] = [];
      let duration = 0;

      if (search.examId) {
        const { data: exam } = await supabase.from("exams").select("id, name_ar, duration_seconds, total_score").eq("id", search.examId).maybeSingle();
        if (exam) setExamMeta(exam as ExamMeta);
        const { data: eq } = await supabase.from("exam_questions").select("order_index, question:questions(*)").eq("exam_id", search.examId).order("order_index");
        const rows = (eq ?? []).map((r) => (r as { question: unknown }).question).filter(Boolean) as Question[];
        parsed = rows.map((r) => ({ ...r, options: Array.isArray(r.options) ? r.options : JSON.parse(r.options as unknown as string) }));
        duration = exam?.duration_seconds ?? parsed.length * 60;
      } else if (search.bank) {
        const { data: qs } = await supabase.from("questions").select("*").eq("subject_id", subjectId).eq("bank_name", search.bank).order("created_at");
        parsed = (qs ?? []).map((r) => ({ ...r, options: Array.isArray(r.options) ? r.options : JSON.parse(r.options as unknown as string) })) as Question[];
        duration = parsed.length * 60;
      } else if (search.units) {
        const units = search.units.split(",").map((n: string) => parseInt(n, 10)).filter((n: number) => !isNaN(n));
        const { data: qs } = await supabase.from("questions").select("*").eq("subject_id", subjectId).in("unit", units);
        const wanted = Math.max(1, parseInt(search.count ?? "10", 10));
        const shuffled = shuffle((qs ?? []).map((r) => ({ ...r, options: Array.isArray(r.options) ? r.options : JSON.parse(r.options as unknown as string) })) as Question[]);
        parsed = shuffled.slice(0, wanted);
        duration = parsed.length * 60;
      } else {
        const { data: qs } = await supabase.from("questions").select("*").eq("subject_id", subjectId).order("created_at");
        parsed = (qs ?? []).map((r) => ({ ...r, options: Array.isArray(r.options) ? r.options : JSON.parse(r.options as unknown as string) })) as Question[];
        duration = parsed.length * 60;
      }

      setQuestions(parsed);
      setSeconds(Math.max(60, duration));
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, search.examId, search.bank, search.units, search.count]);

  useEffect(() => {
    if (submitted || loading) return;
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) { clearInterval(t); setSubmitted(true); return 0; }
        return s - 1;
      });
      setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [submitted, loading]);

  const score = useMemo(() => {
    let correct = 0;
    questions.forEach((qq, i) => { if (answers[i] === qq.correct_answer) correct++; });
    const totalScore = examMeta?.total_score ?? 200;
    return { correct, total: questions.length, outScore: questions.length ? Math.round((correct / questions.length) * totalScore) : 0, maxScore: totalScore };
  }, [answers, questions, examMeta]);

  useEffect(() => {
    if (!submitted || saved || !user || !questions.length) return;
    setSaved(true);
    supabase.from("user_attempts").insert({
      user_id: user.id,
      subject_id: subjectId,
      exam_id: examMeta?.id ?? null,
      score: score.correct,
      total: score.total,
      time_taken_seconds: elapsed,
      answers,
    }).then(({ error }) => {
      if (error) toast.error("لم يتم حفظ النتيجة: " + error.message);
    });
  }, [submitted, saved, user, questions.length]);

  const toggleFlag = (i: number) => {
    const next = new Set(flagged);
    next.has(i) ? next.delete(i) : next.add(i);
    setFlagged(next);
  };

  const attemptSubmit = () => {
    const unanswered = questions.length - Object.keys(answers).length;
    if (unanswered > 0) setShowConfirm(true);
    else setSubmitted(true);
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="grid place-items-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-6 py-16 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-400">
            قريباً
          </div>
          <h1 className="mt-4 text-2xl font-bold">لا توجد أسئلة متاحة لهذا الامتحان</h1>
          <p className="mt-2 text-muted-foreground">تابعنا وسيتم إضافة الأسئلة قريباً.</p>
          <Button asChild className="mt-6"><Link to="/">الرئيسية</Link></Button>
        </div>
      </div>
    );
  }

  if (submitted) return <Results subject={subject!} questions={questions} answers={answers} score={score} elapsed={elapsed} flagged={flagged} />;

  const q = questions[current];
  const progress = ((current + 1) / questions.length) * 100;
  const unanswered = questions.length - Object.keys(answers).length;
  const isFlagged = flagged.has(current);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs text-muted-foreground">{subject?.name_en}</div>
            <h1 className="text-xl font-bold sm:text-2xl">{examMeta?.name_ar ?? subject?.name_ar}</h1>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-mono font-bold ${seconds < 60 ? "bg-destructive/10 text-destructive animate-pulse" : "bg-muted"}`}>
            <Timer className="h-4 w-4" />
            {fmt(seconds)}
          </div>
        </div>

        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>السؤال {current + 1} من {questions.length}</span>
          <span>{Object.keys(answers).length} مُجاب • {flagged.size} معلّم</span>
        </div>
        <Progress value={progress} className="h-2" />

        {(() => {
          const isEn = q.language === "en";
          const dir = isEn ? "ltr" : "rtl";
          const align = isEn ? "text-left" : "text-right";
          const letters = isEn ? ["A", "B", "C", "D"] : ["أ", "ب", "ج", "د"];
          return (
        <div className="mt-8 rounded-3xl border border-border/60 bg-card p-6 shadow-lg sm:p-8" dir={dir}>
          <div className={`flex items-center justify-between ${align}`}>
            <div className="text-sm font-semibold text-primary">
              {isEn ? `Question ${current + 1}` : `سؤال ${current + 1}`}
            </div>
            <button
              onClick={() => toggleFlag(current)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                isFlagged
                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-amber-500/10 hover:text-amber-600"
              }`}
              type="button"
              aria-pressed={isFlagged}
            >
              <Flag className={`h-3.5 w-3.5 ${isFlagged ? "fill-current" : ""}`} />
              {isFlagged ? (isEn ? "Flagged" : "معلّم") : (isEn ? "Flag" : "علّم للمراجعة")}
            </button>
          </div>

          {q.passage && (
            <div dir={dir} className={`mt-4 rounded-2xl border border-border/50 bg-muted/30 p-4 text-sm leading-relaxed sm:p-5 sm:text-base ${align}`} style={{ whiteSpace: "pre-wrap" }}>
              <MathText dir={dir} stripNumber={false} block>{q.passage}</MathText>
            </div>
          )}

          <h2 className={`mt-4 text-xl font-bold leading-relaxed sm:text-2xl ${align}`}>
            <MathText dir={dir}>{q.question}</MathText>
          </h2>

          <div className="mt-6 space-y-3">
            {q.options.map((opt, i) => {
              const selected = answers[current] === i;
              return (
                <button key={i} onClick={() => setAnswers({ ...answers, [current]: i })}
                  dir={dir}
                  className={`flex w-full items-center gap-3 rounded-xl border p-4 ${align} transition ${
                    selected ? "border-primary bg-primary/5 shadow-sm" : "border-border/60 hover:border-primary/40 hover:bg-muted/50"
                  }`}>
                  <div className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-sm font-bold ${
                    selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {letters[i]}
                  </div>
                  <span className="flex-1 text-sm sm:text-base"><MathText dir={dir} stripNumber={false}>{opt}</MathText></span>
                </button>
              );
            })}
          </div>
        </div>
          );
        })()}

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button variant="outline" onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}>
            <ArrowRight className="ml-1 h-4 w-4" /> السابق
          </Button>
          {current < questions.length - 1 ? (
            <Button onClick={() => setCurrent((c) => c + 1)}>التالي <ArrowLeft className="mr-1 h-4 w-4" /></Button>
          ) : (
            <Button onClick={attemptSubmit} className="bg-emerald-600 hover:bg-emerald-700">إنهاء الامتحان ✓</Button>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {questions.map((_, i) => {
            const answered = answers[i] !== undefined;
            const isFlag = flagged.has(i);
            const isCur = i === current;
            return (
              <button key={i} onClick={() => setCurrent(i)}
                className={`relative h-9 w-9 rounded-lg text-xs font-bold transition ${
                  isCur ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background" :
                  answered ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}>
                {i + 1}
                {isFlag && (
                  <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-amber-500 text-white shadow">
                    <Flag className="h-2.5 w-2.5 fill-current" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="inline-flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                هل أنت متأكد من الإنهاء؟
              </AlertDialogTitle>
              <AlertDialogDescription>
                لديك <span className="font-bold text-destructive">{unanswered}</span> سؤال{unanswered === 1 ? "" : "اً"} بدون إجابة.
                يمكنك العودة والإجابة عليها، أو إنهاء الامتحان الآن.
                {flagged.size > 0 && <div className="mt-2 text-xs">وأيضاً {flagged.size} سؤال معلّم للمراجعة.</div>}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>عودة للأسئلة</AlertDialogCancel>
              <AlertDialogAction onClick={() => setSubmitted(true)} className="bg-emerald-600 hover:bg-emerald-700">
                إنهاء رغم ذلك
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function Results({ subject, questions, answers, score, elapsed, flagged }: {
  subject: Subject; questions: Question[]; answers: Record<number, number>;
  score: { correct: number; total: number; outScore: number; maxScore: number }; elapsed: number;
  flagged: Set<number>;
}) {
  const pct = (score.correct / score.total) * 100;
  const grade = pct >= 90 ? "ممتاز" : pct >= 75 ? "جيد جداً" : pct >= 60 ? "جيد" : pct >= 50 ? "مقبول" : "يحتاج تحسين";
  const gradeColor = pct >= 75 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-destructive";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-primary/5 p-8 text-center shadow-xl">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
            <Trophy className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-3xl font-black">اكتمل الامتحان!</h1>
          <p className="mt-1 text-muted-foreground">{subject.name_ar}</p>

          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="rounded-2xl bg-background p-4">
              <div className="text-3xl font-black text-primary">{score.outScore}<span className="text-base text-muted-foreground">/{score.maxScore}</span></div>
              <div className="mt-1 text-xs text-muted-foreground">العلامة</div>
            </div>
            <div className="rounded-2xl bg-background p-4">
              <div className={`text-3xl font-black ${gradeColor}`}>{Math.round(pct)}%</div>
              <div className="mt-1 text-xs text-muted-foreground">النسبة — {grade}</div>
            </div>
            <div className="rounded-2xl bg-background p-4">
              <div className="text-3xl font-black">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}</div>
              <div className="mt-1 text-xs text-muted-foreground">الوقت</div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
            <div className="inline-flex items-center gap-1.5 text-emerald-600"><CheckCircle2 className="h-4 w-4" /> {score.correct} صحيحة</div>
            <div className="inline-flex items-center gap-1.5 text-destructive"><XCircle className="h-4 w-4" /> {score.total - score.correct} خاطئة</div>
            {flagged.size > 0 && <div className="inline-flex items-center gap-1.5 text-amber-600"><Flag className="h-4 w-4" /> {flagged.size} معلّمة</div>}
          </div>
        </div>

        <h2 className="mt-10 mb-4 text-xl font-bold">مراجعة الإجابات</h2>
        <div className="space-y-3">
          {questions.map((q, i) => {
            const userAns = answers[i];
            const correct = userAns === q.correct_answer;
            const isEn = q.language === "en";
            const dir = isEn ? "ltr" : "rtl";
            return (
              <div key={q.id} className={`rounded-2xl border p-5 ${correct ? "border-emerald-500/30 bg-emerald-500/5" : "border-destructive/30 bg-destructive/5"}`}>
                <div className="flex items-start gap-3">
                  {correct
                    ? <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                    : <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />}
                  <div className="min-w-0 flex-1" dir={dir}>
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                      {isEn ? `Question ${i + 1}` : `سؤال ${i + 1}`}
                      {flagged.has(i) && <Flag className="h-3 w-3 fill-amber-500 text-amber-500" />}
                    </div>
                    {q.passage && (
                      <div dir={dir} className="mt-2 rounded-lg border border-border/40 bg-background/60 p-3 text-xs leading-relaxed" style={{ whiteSpace: "pre-wrap" }}>
                        <MathText dir={dir} stripNumber={false} block>{q.passage}</MathText>
                      </div>
                    )}
                    <p className="mt-1 font-semibold"><MathText dir={dir}>{q.question}</MathText></p>
                    <div className="mt-3 space-y-1 text-sm">
                      {userAns !== undefined && userAns !== q.correct_answer && (
                        <div className="text-destructive">{isEn ? "Your answer" : "إجابتك"}: <MathText dir={dir} stripNumber={false}>{q.options[userAns]}</MathText></div>
                      )}
                      <div className="text-emerald-700 dark:text-emerald-500">{isEn ? "Correct answer" : "الإجابة الصحيحة"}: <MathText dir={dir} stripNumber={false}>{q.options[q.correct_answer]}</MathText></div>
                    </div>
                    {q.explanation && (
                      <div className="mt-3 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{isEn ? "Explanation" : "التفسير"}:</span> <MathText dir={dir}>{q.explanation}</MathText>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" variant="outline">
            <Link to="/"><Home className="ml-2 h-4 w-4" /> الرئيسية</Link>
          </Button>
          <Button asChild size="lg">
            <Link to="/leaderboard"><Trophy className="ml-2 h-4 w-4" /> لوحة الصدارة</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
