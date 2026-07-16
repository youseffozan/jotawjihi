import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Layers, Shuffle } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/subject/$subjectId/banks")({
  component: BanksChooserPage,
});

function BanksChooserPage() {
  const { subjectId } = Route.useParams();

  const tiles = [
    {
      to: "/subject/$subjectId/question-banks" as const,
      title: "بنوك الأسئلة",
      subtitle: "Question Banks",
      desc: "بنوك أسئلة منظمة من إعداد المدرسين — تدرّب على مواضيع محددة بعمق.",
      icon: Layers,
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      to: "/subject/$subjectId/random" as const,
      title: "امتحانات عشوائية",
      subtitle: "Random / Custom by Unit",
      desc: "خصّص امتحانك — اختر الوحدات (1–9) وعدد الأسئلة ونولّد لك امتحاناً.",
      icon: Shuffle,
      gradient: "from-purple-500 to-fuchsia-600",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Link to="/subject/$subjectId" params={{ subjectId }} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> عودة
        </Link>
        <div className="mt-6 animate-fade-up">
          <h1 className="text-3xl font-black md:text-4xl">امتحانات أخرى</h1>
          <p className="mt-2 text-muted-foreground">اختر نوع التدريب:</p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {tiles.map((t, i) => {
            const Icon = t.icon;
            return (
              <Link key={t.to} to={t.to} params={{ subjectId }}
                className="card-interactive group relative overflow-hidden rounded-3xl border border-border/60 bg-card p-8 animate-fade-up hover:border-primary/60 hover:shadow-2xl hover:shadow-primary/10"
                style={{ animationDelay: `${i * 80}ms` }}>
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
      </div>
      <SiteFooter />
    </div>
  );
}
