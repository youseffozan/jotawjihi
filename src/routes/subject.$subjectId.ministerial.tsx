import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpenCheck, Clock, Loader2, Trophy } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";

type Exam = {
  id: string; name_ar: string; name_en: string | null; description: string | null;
  year: number | null; duration_seconds: number; total_score: number; active: boolean;
};
type Subject = { id: string; name_ar: string };

export const Route = createFileRoute("/subject/$subjectId/ministerial")({
  component: MinisterialListPage,
});

function MinisterialListPage() {
  const { subjectId } = Route.useParams();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: e }] = await Promise.all([
        supabase.from("subjects").select("id, name_ar").eq("id", subjectId).maybeSingle(),
        supabase.from("exams").select("*").eq("subject_id", subjectId).eq("type", "ministerial").eq("active", true).order("sort_order").order("year", { ascending: false }),
      ]);
      setSubject(s as Subject | null);
      setExams((e ?? []) as Exam[]);
      setLoading(false);
    })();
  }, [subjectId]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Link to="/subject/$subjectId" params={{ subjectId }} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> عودة
        </Link>
        <div className="mt-6 animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <BookOpenCheck className="h-3.5 w-3.5" /> الامتحانات الوزارية
          </div>
          <h1 className="mt-3 text-3xl font-black md:text-4xl">{subject?.name_ar ?? "المادة"}</h1>
          <p className="mt-2 text-muted-foreground">اختر الامتحان الوزاري الذي تريد التدرب عليه:</p>
        </div>

        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : exams.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
            <Trophy className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-bold">لا توجد امتحانات وزارية متاحة بعد</h2>
            <p className="mt-2 text-sm text-muted-foreground">سيتم إضافتها قريباً من قِبل الإدارة.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {exams.map((ex, i) => (
              <Link
                key={ex.id}
                to="/exam/$subjectId"
                params={{ subjectId }}
                search={{ examId: ex.id }}
                className="card-interactive group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 animate-fade-up hover:border-emerald-500/60 hover:shadow-xl hover:shadow-emerald-500/10"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="pointer-events-none absolute -left-6 -top-6 h-32 w-32 rounded-full bg-emerald-500/20 blur-3xl transition-all duration-500 group-hover:scale-125 group-hover:opacity-70" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                      <BookOpenCheck className="h-6 w-6" />
                    </div>
                    {ex.year && <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold">{ex.year}</span>}
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{ex.name_ar}</h3>
                  {ex.name_en && <p className="text-xs text-muted-foreground">{ex.name_en}</p>}
                  {ex.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{ex.description}</p>}
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1"><Clock className="h-3 w-3" /> {Math.round(ex.duration_seconds / 60)} دقيقة</span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1"><Trophy className="h-3 w-3" /> {ex.total_score} علامة</span>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    ابدأ الآن <ArrowLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-1" />
                  </div>
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
