import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { isSubjectAvailable, useSubjectStatuses } from "@/lib/available-subjects";
import { SubjectCard } from "@/components/SubjectCard";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type SubjectRow = { id: string; name_ar: string; name_en: string; icon: string | null; status: string };

const DEFAULT_COLORS = [
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-blue-500 to-indigo-600",
  "from-rose-500 to-pink-600",
  "from-purple-500 to-fuchsia-600",
  "from-cyan-500 to-blue-600",
];

export const Route = createFileRoute("/grade-11")({
  head: () => ({
    meta: [
      { title: "الأول ثانوي — جو توجيهي" },
      { name: "description", content: "امتحانات محاكية لطلاب الأول ثانوي في الأردن." },
    ],
  }),
  component: Grade11Page,
});

function Grade11Page() {
  const statuses = useSubjectStatuses();
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [bestBySubject, setBestBySubject] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    (async () => {
      const [{ data }, { data: qs }] = await Promise.all([
        supabase.from("subjects").select("id, name_ar, name_en, icon, status").eq("grade", "11").order("id"),
        supabase.rpc("get_question_counts_by_subject"),
      ]);
      setSubjects((data ?? []) as SubjectRow[]);
      const m = new Map<string, number>();
      for (const q of (qs ?? []) as { subject_id: string; question_count: number }[]) m.set(q.subject_id, Number(q.question_count));
      setCounts(m);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!user) { setBestBySubject(new Map()); return; }
    (async () => {
      const { data } = await supabase.from("user_attempts").select("subject_id, score, total").eq("user_id", user.id);
      const best = new Map<string, number>();
      for (const a of data ?? []) {
        if (!a.total || a.total <= 0) continue;
        const pct = Math.min(100, (a.score / a.total) * 100);
        best.set(a.subject_id, Math.max(best.get(a.subject_id) ?? 0, pct));
      }
      setBestBySubject(best);
    })();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4 transition-transform hover:-translate-x-1" /> العودة
        </Link>
        <div className="mt-6 animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <BookOpen className="h-3.5 w-3.5" /> الأول ثانوي
          </div>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            اختر المبحث الذي تريد التدرب عليه
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            المواد الأساسية لطلاب الصف الحادي عشر. اختر المادة للانتقال إلى صفحة الامتحانات الوزارية، بنوك الأسئلة، والامتحانات العشوائية.
          </p>
        </div>

        {loading ? (
          <div className="grid place-items-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : subjects.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
            <p className="text-sm text-muted-foreground">لم يتم إضافة مواد بعد.</p>
          </div>
        ) : (() => {
          const visible = subjects.filter((s) => isSubjectAvailable(s.id, statuses));
          const hiddenCount = subjects.length - visible.length;
          return (
            <>
              {visible.length === 0 ? (
                <div className="mt-10 rounded-3xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
                  <p className="text-sm text-muted-foreground">المزيد من المواد قريباً…</p>
                </div>
              ) : (
                <div className="mt-10 grid gap-5 sm:grid-cols-2">
                  {visible.map((s, i) => (
                    <SubjectCard
                      key={s.id}
                      id={s.id}
                      nameAr={s.name_ar}
                      nameEn={s.name_en}
                      icon={s.icon ?? "📘"}
                      color={DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                      questionsCount={counts.get(s.id) ?? 0}
                      bestScorePct={bestBySubject.get(s.id) ?? null}
                      available
                      index={i}
                      to="/subject/$subjectId"
                      params={{ subjectId: s.id }}
                    />
                  ))}
                </div>
              )}
              {hiddenCount > 0 && visible.length > 0 && (
                <p className="mt-6 text-center text-xs text-muted-foreground">
                  المزيد من المواد قريباً…
                </p>
              )}
            </>
          );
        })()}
      </div>
      <SiteFooter />
    </div>
  );
}
