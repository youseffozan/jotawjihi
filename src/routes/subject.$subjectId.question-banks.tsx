import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Layers, Loader2, ListOrdered } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";

type Exam = { id: string; name_ar: string; name_en: string | null; description: string | null; duration_seconds: number; total_score: number };
type Subject = { id: string; name_ar: string };
type BankGroup = { name: string; count: number };

export const Route = createFileRoute("/subject/$subjectId/question-banks")({
  component: QuestionBanksListPage,
});

function QuestionBanksListPage() {
  const { subjectId } = Route.useParams();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [banks, setBanks] = useState<BankGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: e }, { data: qs }] = await Promise.all([
        supabase.from("subjects").select("id, name_ar").eq("id", subjectId).maybeSingle(),
        supabase.from("exams").select("id, name_ar, name_en, description, duration_seconds, total_score").eq("subject_id", subjectId).eq("type", "bank").eq("active", true).order("sort_order"),
        supabase.from("questions").select("bank_name").eq("subject_id", subjectId).not("bank_name", "is", null),
      ]);
      setSubject(s as Subject | null);
      setExams((e ?? []) as Exam[]);
      const map = new Map<string, number>();
      for (const q of qs ?? []) {
        const name = (q as { bank_name: string | null }).bank_name;
        if (!name) continue;
        map.set(name, (map.get(name) ?? 0) + 1);
      }
      setBanks([...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name, "ar")));
      setLoading(false);
    })();
  }, [subjectId]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Link to="/subject/$subjectId/banks" params={{ subjectId }} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> عودة
        </Link>
        <div className="mt-6 animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300">
            <Layers className="h-3.5 w-3.5" /> بنوك الأسئلة
          </div>
          <h1 className="mt-3 text-3xl font-black md:text-4xl">{subject?.name_ar ?? "المادة"}</h1>
          <p className="mt-2 text-muted-foreground">اختر بنك الأسئلة الذي تريد التدرب عليه.</p>
        </div>

        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : exams.length === 0 && banks.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
            <ListOrdered className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-bold">لا توجد بنوك أسئلة بعد</h2>
            <p className="mt-2 text-sm text-muted-foreground">سيتم إضافتها قريباً.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {exams.map((ex, i) => (
              <Link key={ex.id} to="/exam/$subjectId" params={{ subjectId }} search={{ examId: ex.id }}
                className="card-interactive group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 animate-fade-up hover:border-blue-500/60 hover:shadow-xl hover:shadow-blue-500/10"
                style={{ animationDelay: `${i * 60}ms` }}>
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg"><Layers className="h-6 w-6" /></div>
                <h3 className="mt-4 text-lg font-bold">{ex.name_ar}</h3>
                {ex.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{ex.description}</p>}
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-md bg-muted px-2 py-1">{Math.round(ex.duration_seconds / 60)} دقيقة</span>
                  <span className="rounded-md bg-muted px-2 py-1">{ex.total_score} علامة</span>
                </div>
              </Link>
            ))}
            {banks.map((b, i) => (
              <Link key={`bank-${b.name}`} to="/exam/$subjectId" params={{ subjectId }} search={{ bank: b.name }}
                className="card-interactive group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 animate-fade-up hover:border-blue-500/60 hover:shadow-xl hover:shadow-blue-500/10"
                style={{ animationDelay: `${(exams.length + i) * 60}ms` }}>
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg"><ListOrdered className="h-6 w-6" /></div>
                <h3 className="mt-4 text-lg font-bold">{b.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{b.count} سؤال</p>
                <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400">
                  ابدأ <ArrowLeft className="h-3.5 w-3.5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
