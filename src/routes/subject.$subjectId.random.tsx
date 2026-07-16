import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Shuffle, Loader2, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type Subject = { id: string; name_ar: string };
type UnitCount = { unit: number; count: number };

export const Route = createFileRoute("/subject/$subjectId/random")({
  component: RandomExamPage,
});

function RandomExamPage() {
  const { subjectId } = Route.useParams();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [units, setUnits] = useState<UnitCount[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: qs }] = await Promise.all([
        supabase.from("subjects").select("id, name_ar").eq("id", subjectId).maybeSingle(),
        supabase.from("questions").select("unit").eq("subject_id", subjectId).not("unit", "is", null),
      ]);
      setSubject(s as Subject | null);
      const map = new Map<number, number>();
      for (const q of qs ?? []) {
        const u = (q as { unit: number | null }).unit;
        if (u == null) continue;
        map.set(u, (map.get(u) ?? 0) + 1);
      }
      setUnits([...map.entries()].map(([unit, c]) => ({ unit, count: c })).sort((a, b) => a.unit - b.unit));
      setLoading(false);
    })();
  }, [subjectId]);

  const totalSelected = useMemo(() =>
    units.filter((u) => selected.has(u.unit)).reduce((s, u) => s + u.count, 0),
  [units, selected]);

  const toggle = (u: number) => {
    const next = new Set(selected);
    next.has(u) ? next.delete(u) : next.add(u);
    setSelected(next);
  };

  const start = () => {
    if (!selected.size) return;
    navigate({
      to: "/exam/$subjectId",
      params: { subjectId },
      search: { units: [...selected].sort((a, b) => a - b).join(","), count: String(Math.min(count, totalSelected)) },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link to="/subject/$subjectId" params={{ subjectId }} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> عودة
        </Link>
        <div className="mt-6 animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/15 px-3 py-1 text-xs font-bold text-purple-700 dark:text-purple-300">
            <Shuffle className="h-3.5 w-3.5" /> امتحان عشوائي مخصّص
          </div>
          <h1 className="mt-3 text-3xl font-black md:text-4xl">{subject?.name_ar ?? "المادة"}</h1>
          <p className="mt-2 text-muted-foreground">اختر الوحدات وعدد الأسئلة، وسنولّد لك امتحاناً عشوائياً من قاعدة البيانات.</p>
        </div>

        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : units.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-bold">لا توجد وحدات مصنّفة بعد</h2>
            <p className="mt-2 text-sm text-muted-foreground">يجب على المدرس/الإدارة تصنيف الأسئلة بالوحدة (1–9) أولاً.</p>
          </div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-5">
              {units.map((u, i) => {
                const on = selected.has(u.unit);
                return (
                  <button key={u.unit} onClick={() => toggle(u.unit)}
                    style={{ animationDelay: `${i * 40}ms` }}
                    className={`animate-fade-up rounded-2xl border p-4 text-center transition ${
                      on ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20" : "border-border/60 bg-card hover:border-purple-500/40 hover:bg-muted/50"
                    }`}>
                    <div className={`text-xs font-semibold ${on ? "text-purple-600 dark:text-purple-400" : "text-muted-foreground"}`}>الوحدة</div>
                    <div className={`text-3xl font-black ${on ? "text-purple-600 dark:text-purple-400" : ""}`}>{u.unit}</div>
                    <div className="text-[10px] text-muted-foreground">{u.count} سؤال</div>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 rounded-2xl border border-border/60 bg-card p-6">
              <label className="text-sm font-semibold">عدد الأسئلة: <span className="text-purple-600 dark:text-purple-400">{Math.min(count, totalSelected || count)}</span></label>
              <input type="range" min={5} max={Math.max(50, totalSelected)} step={5} value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="mt-3 w-full accent-purple-500" />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>5</span><span>الحد الأقصى: {totalSelected || "—"}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                {selected.size ? `${selected.size} وحدة مختارة • ${totalSelected} سؤال متاح` : "اختر وحدة واحدة على الأقل"}
              </div>
              <Button size="lg" onClick={start} disabled={!selected.size} className="bg-purple-600 hover:bg-purple-700">
                ابدأ الامتحان <Shuffle className="mr-2 h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
