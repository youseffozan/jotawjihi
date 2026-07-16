import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, X, Clock, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { SubjectStatus } from "@/lib/available-subjects";

type SubjectRow = {
  id: string;
  name_ar: string;
  name_en: string;
  grade: string;
  field: string | null;
  status: SubjectStatus;
};

const FIELD_LABELS: Record<string, string> = {
  medical: "طبي",
  engineering: "هندسي",
  "science-tech": "علوم وتكنولوجيا",
  business: "أعمال",
  languages: "لغات",
  law: "شرعي",
};

function gradeLabel(g: string) {
  return g === "12" ? "التوجيهي" : "الأول ثانوي";
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

export function SubjectSearch({
  compact = false,
  onNavigate,
}: {
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("subjects")
      .select("id, name_ar, name_en, grade, field, status")
      .then(({ data }) => {
        if (!cancelled && data) setSubjects(data as unknown as SubjectRow[]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const results = useMemo(() => {
    const nq = normalize(q);
    if (!nq) return [] as SubjectRow[];
    return subjects
      .map((s) => {
        const hay = normalize(`${s.name_ar} ${s.name_en} ${FIELD_LABELS[s.field ?? ""] ?? ""}`);
        return { s, ok: hay.includes(nq) };
      })
      .filter((x) => x.ok)
      .slice(0, 8)
      .map((x) => x.s);
  }, [q, subjects]);

  const go = (s: SubjectRow) => {
    setOpen(false);
    setQ("");
    onNavigate?.();
    const available = s.status === "available";
    if (!available) {
      if (s.grade === "11") navigate({ to: "/grade-11" });
      else if (s.field) navigate({ to: "/grade-12/$field", params: { field: s.field } });
      else navigate({ to: "/grade-12" });
      return;
    }
    navigate({ to: "/subject/$subjectId", params: { subjectId: s.id } });
  };


  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${compact ? "w-full" : "w-full max-w-xs"}`}>
      <div className="relative">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder="ابحث عن مادة…"
          className="h-9 w-full rounded-full border border-border/60 bg-muted/40 py-2 pl-9 pr-9 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/20"
        />
        {q && (
          <button
            type="button"
            aria-label="مسح"
            onClick={() => {
              setQ("");
              inputRef.current?.focus();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && q && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border/60 bg-popover shadow-xl animate-fade-up">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              لم نجد مادة تطابق البحث.
            </div>
          ) : (
            <ul className="max-h-80 overflow-auto py-1">
              {results.map((s, i) => {
                const available = s.status === "available";
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(s)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-right text-sm transition ${
                        i === active ? "bg-primary/10" : "hover:bg-muted"
                      }`}
                    >
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${available ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                        <BookOpen className="h-4 w-4" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block truncate font-semibold">{s.name_ar}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {gradeLabel(s.grade)}
                          {s.field ? ` • ${FIELD_LABELS[s.field] ?? s.field}` : ""}
                        </span>
                      </span>
                      {!available && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                          <Clock className="h-3 w-3" /> قريباً
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
