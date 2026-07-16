import { Link } from "@tanstack/react-router";
import { BookOpenCheck, Layers, ArrowLeft } from "lucide-react";

type Subject = {
  id: string;
  name_ar: string;
  name_en: string | null;
  icon: string | null;
};

/**
 * Subject Hub — original clean 2-tile layout.
 * Ministerial → /subject/$id/ministerial (past-paper picker)
 * Other Exams → /subject/$id/banks (chooser: Question Banks or Random by Unit)
 */
export function SubjectHub({ subject, backHref, backLabel }: {
  subject: Subject;
  backHref?: React.ReactNode;
  backLabel?: string;
}) {
  const tiles = [
    {
      to: "/subject/$subjectId/ministerial" as const,
      title: "الامتحانات الوزارية",
      subtitle: "Ministerial Exams",
      desc: "امتحانات وزارية سابقة معتمدة — اختر الامتحان الذي تريد التدرب عليه.",
      icon: BookOpenCheck,
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      to: "/subject/$subjectId/banks" as const,
      title: "امتحانات أخرى",
      subtitle: "Other Exams",
      desc: "بنوك أسئلة منظمة أو امتحانات عشوائية مخصّصة حسب الوحدات (1–9).",
      icon: Layers,
      gradient: "from-blue-500 to-indigo-600",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {backHref}

      <div className="mt-6 flex items-start gap-4 animate-fade-up">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary/80 to-primary text-3xl text-white shadow-lg">
          {subject.icon ?? "📘"}
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">{subject.name_ar}</h1>
          {subject.name_en && <p className="mt-1 text-muted-foreground">{subject.name_en}</p>}
        </div>
      </div>

      <p className="mt-8 text-muted-foreground">اختر نوع الامتحان الذي تريد التدرب عليه:</p>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {tiles.map((t, i) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              params={{ subjectId: subject.id }}
              className="card-interactive group relative overflow-hidden rounded-3xl border border-border/60 bg-card p-8 animate-fade-up hover:border-primary/60 hover:shadow-2xl hover:shadow-primary/10"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`pointer-events-none absolute -left-8 -top-8 h-40 w-40 rounded-full bg-gradient-to-br ${t.gradient} opacity-15 blur-3xl transition-all duration-500 group-hover:scale-125 group-hover:opacity-40`} />
              <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${t.gradient} text-white shadow-lg`}>
                <Icon className="h-7 w-7" />
              </div>
              <h3 className="mt-6 text-2xl font-bold">{t.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
              <p className="mt-4 text-sm text-muted-foreground">{t.desc}</p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                افتح <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>
      {backLabel && <div className="sr-only">{backLabel}</div>}
    </div>
  );
}
