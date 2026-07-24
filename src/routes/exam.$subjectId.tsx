import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Timer, CheckCircle2, XCircle, Trophy, ArrowLeft, ArrowRight, Home, Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { MathText } from "@/components/MathText";
import { isSubjectAvailable, useSubjectStatuses } from "@/lib/available-subjects";

type Subject = { id: string; name_ar: string; name_en: string; icon: string | null };
type Question = { id: string; question: string; options: string[]; correct_answer: number; explanation: string | null; passage: string | null; language: string };

export const Route = createFileRoute("/exam/$subjectId")({
  component: ExamPage,
});

function ExamPage() {
  const { subjectId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const statuses = useSubjectStatuses();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: qs }] = await Promise.all([
        supabase.from("subjects").select("id,name_ar,name_en,icon").eq("id", subjectId).maybeSingle(),
        supabase.from("questions").select("id,question,options,correct_answer,explanation,passage,language").eq("subject_id", subjectId).order("created_at"),
      ]);
      if (!s) { navigate({ to: "/" }); return; }
      setSubject(s as Subject);
      const parsed = (qs ?? []).map((r: any) => ({ ...r, options: Array.isArray(r.options) ? r.options : JSON.parse(r.options) })) as Question[];
      setQuestions(parsed);
      setSeconds(parsed.length * 60);
      setLoading(false);
    })();
  }, [subjectId]);

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
    return { correct, total: questions.length, out200: questions.length ? Math.round((correct / questions.length) * 200) : 0 };
  }, [answers, questions]);

  useEffect(() => {
    if (!submitted || saved || !user || !questions.length) return;
    setSaved(true);
    supabase.from("user_attempts").insert({
      user_id: user.id,
      subject_id: subjectId,
      score: score.correct,
      total: score.total,
      time_taken_seconds: elapsed,
      answers,
    }).then(({ error }) => {
      if (error) toast.error("لم يتم حفظ النتيجة: " + error.message);
    });
  }, [submitted, saved, user, questions.length]);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="grid place-items-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  if (!isSubjectAvailable(subjectId, statuses) || !questions.length) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-6 py-16 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-400">
            قريباً
          </div>
          <h1 className="mt-4 text-2xl font-bold">هذا الامتحان قيد الإعداد</h1>
          <p className="mt-2 text-muted-foreground">نعمل حالياً على إضافة أسئلة هذه المادة. تابعنا وسيتم الإطلاق قريباً.</p>
          <Button asChild className="mt-6"><Link to="/">الرئيسية</Link></Button>
        </div>
      </div>
    );
  }

  if (submitted) return <Results subject={subject!} questions={questions} answers={answers} score={score} elapsed={elapsed} />;

  const q = questions[current];
  const progress = ((current + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs text-muted-foreground">{subject?.name_en}</div>
            <h1 className="text-xl font-bold sm:text-2xl">{subject?.name_ar}</h1>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-mono font-bold ${seconds < 60 ? "bg-destructive/10 text-destructive" : "bg-muted"}`}>
            <Timer className="h-4 w-4" />
            {fmt(seconds)}
          </div>
        </div>

        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>السؤال {current + 1} من {questions.length}</span>
          <span>{Object.keys(answers).length} مُجاب</span>
        </div>
        <Progress value={progress} className="h-2" />

        {(() => {
          const isEn = q.language === "en";
          const dir = isEn ? "ltr" : "rtl";
          const align = isEn ? "text-left" : "text-right";
          const letters = isEn ? ["A", "B", "C", "D"] : ["أ", "ب", "ج", "د"];
          return (
        <div className="mt-8 rounded-3xl border border-border/60 bg-card p-6 shadow-lg sm:p-8" dir={dir}>
          <div className={`text-sm font-semibold text-primary ${align}`}>
            {isEn ? `Question ${current + 1}` : `سؤال ${current + 1}`}
          </div>

          {q.passage && (
            <div
              dir={dir}
              className={`mt-4 rounded-2xl border border-border/50 bg-muted/30 p-4 text-sm leading-relaxed sm:p-5 sm:text-base ${align}`}
              style={{ whiteSpace: "pre-wrap" }}
            >
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
            <Button onClick={() => setSubmitted(true)} className="bg-emerald-600 hover:bg-emerald-700">إنهاء الامتحان ✓</Button>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {questions.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`h-9 w-9 rounded-lg text-xs font-bold transition ${
                i === current ? "bg-primary text-primary-foreground" :
                answers[i] !== undefined ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}>{i + 1}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Results({ subject, questions, answers, score, elapsed }: {
  subject: Subject; questions: Question[]; answers: Record<number, number>;
  score: { correct: number; total: number; out200: number }; elapsed: number;
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
              <div className="text-3xl font-black text-primary">{score.out200}<span className="text-base text-muted-foreground">/200</span></div>
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

          <div className="mt-6 flex items-center justify-center gap-4 text-sm">
            <div className="inline-flex items-center gap-1.5 text-emerald-600"><CheckCircle2 className="h-4 w-4" /> {score.correct} صحيحة</div>
            <div className="inline-flex items-center gap-1.5 text-destructive"><XCircle className="h-4 w-4" /> {score.total - score.correct} خاطئة</div>
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
                    <div className="text-xs font-semibold text-muted-foreground">{isEn ? `Question ${i + 1}` : `سؤال ${i + 1}`}</div>
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
