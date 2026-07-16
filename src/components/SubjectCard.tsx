import { Link } from "@tanstack/react-router";
import { PlayCircle, Clock, Lock, Sparkles, RotateCcw } from "lucide-react";

type SubjectCardProps = {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  color: string;
  questionsCount: number;
  available: boolean;
  index?: number;
  to?: React.ComponentProps<typeof Link>["to"];
  params?: Record<string, string>;
  bestScorePct?: number | null;
};

export function SubjectCard({
  id, nameAr, nameEn, icon, color, questionsCount, available, index = 0, to, params, bestScorePct,
}: SubjectCardProps) {
  const hasBest = available && typeof bestScorePct === "number" && bestScorePct > 0;
  const cardCls = [
    "card-interactive group relative isolate overflow-hidden rounded-2xl border p-6 animate-fade-up",
    available
      ? "border-border/60 bg-card hover:border-primary/60 hover:shadow-2xl hover:shadow-primary/15"
      : "border-dashed border-border/50 bg-card/50 soon-stripes cursor-not-allowed",
  ].join(" ");

  const inner = (
    <>
      <div
        className={`pointer-events-none absolute -left-6 -top-6 h-32 w-32 rounded-full bg-linear-to-br ${color} blur-3xl transition-all duration-500 ${
          available ? "opacity-25 group-hover:scale-125 group-hover:opacity-50" : "opacity-10"
        }`}
      />

      {!available && (
        <span className="absolute right-4 top-4 z-10 inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-700 backdrop-blur-sm dark:text-amber-300">
          <Clock className="h-3 w-3" /> قريباً
        </span>
      )}
      {available && (
        <span className="absolute right-4 top-4 z-10 inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-700 backdrop-blur-sm dark:text-emerald-300">
          <Sparkles className="h-3 w-3" /> متاح الآن
        </span>
      )}

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div
            className={`grid h-14 w-14 place-items-center rounded-2xl bg-linear-to-br ${color} text-2xl text-white shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${
              available ? "" : "grayscale-[35%]"
            }`}
          >
            <span className="drop-shadow-sm">{icon}</span>
          </div>
          <h3 className="mt-4 text-xl font-bold tracking-tight">{nameAr}</h3>
          <p className="text-sm text-muted-foreground">{nameEn}</p>
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            {available ? (
              <>
                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-semibold">
                  {questionsCount} أسئلة
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5">
                  ~{questionsCount * 2} دقيقة
                </span>
              </>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5">
                <Lock className="h-3 w-3" /> سيتم إضافة الأسئلة قريباً
              </span>
            )}
          </div>
          {hasBest && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 text-[11px] font-bold text-primary">
              <RotateCcw className="h-3 w-3" /> أفضل نتيجة: {Math.round(bestScorePct!)}% — إعادة المحاولة
            </div>
          )}
        </div>

        {available ? (
          <div className={`grid h-11 w-11 place-items-center rounded-full ${hasBest ? "bg-emerald-600" : "bg-primary"} text-primary-foreground shadow-lg shadow-primary/25 transition-transform duration-300 group-hover:scale-110 animate-pulse-ring`}>
            {hasBest ? <RotateCcw className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
          </div>
        ) : (
          <div className="grid h-11 w-11 place-items-center rounded-full bg-muted text-muted-foreground">
            <Lock className="h-4 w-4" />
          </div>
        )}
      </div>
    </>
  );

  const style = { animationDelay: `${index * 60}ms` } as React.CSSProperties;

  return available && to ? (
    <Link
      key={id}
      to={to}
      params={params as never}
      className={cardCls}
      style={style}
    >
      {inner}
    </Link>
  ) : (
    <div key={id} className={cardCls} style={style} aria-disabled="true">
      {inner}
    </div>
  );
}
