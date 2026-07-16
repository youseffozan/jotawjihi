import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { grade12Fields } from "@/lib/exam-data";
import { ArrowLeft, Beaker, BookMarked } from "lucide-react";

export const Route = createFileRoute("/grade-12/")({
  head: () => ({
    meta: [
      { title: "التوجيهي — اختر حقلك الأكاديمي | جو توجيهي" },
      { name: "description", content: "اختر الحقل الأكاديمي المناسب لك من المسار الأكاديمي الجديد: الطبي، الهندسي، العلوم، اللغات، القانون، والأعمال." },
    ],
  }),
  component: Grade12Page,
});

function Grade12Page() {
  const scientific = grade12Fields.filter((f) => f.category === "scientific");
  const humanitarian = grade12Fields.filter((f) => f.category === "humanitarian");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> العودة
        </Link>
        <div className="mt-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs">التوجيهي — المسار الأكاديمي الجديد</div>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">اختر حقلك الأكاديمي</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">النظام الأكاديمي الجديد يقسّم الطلبة إلى ستة حقول عبر توجهين رئيسيين. اختر الحقل لعرض المواد الخاصة به.</p>
        </div>

        <FieldGroup
          title="حقول ذات توجهات علمية"
          subtitle="Scientific Fields"
          icon={<Beaker className="h-5 w-5" />}
          gradient="from-cyan-500 to-blue-600"
          fields={scientific}
        />
        <FieldGroup
          title="حقول ذات توجهات إنسانية واجتماعية"
          subtitle="Humanitarian & Social Fields"
          icon={<BookMarked className="h-5 w-5" />}
          gradient="from-amber-500 to-orange-600"
          fields={humanitarian}
        />
      </div>
      <SiteFooter />
    </div>
  );
}

function FieldGroup({
  title, subtitle, icon, gradient, fields,
}: {
  title: string; subtitle: string; icon: React.ReactNode; gradient: string;
  fields: typeof grade12Fields;
}) {
  return (
    <section className="mt-12">
      <div className="flex items-center gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${gradient} text-white`}>
          {icon}
        </div>
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {fields.map((f, i) => (
          <Link
            key={f.id}
            to="/grade-12/$field"
            params={{ field: f.id }}
            className="card-interactive group relative isolate overflow-hidden rounded-2xl border border-border/60 bg-card p-6 animate-fade-up hover:border-primary/60 hover:shadow-2xl hover:shadow-primary/10"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className={`pointer-events-none absolute -left-6 -top-6 h-32 w-32 rounded-full bg-linear-to-br ${gradient} opacity-15 blur-3xl transition-all duration-500 group-hover:scale-125 group-hover:opacity-40`} />
            <div className="relative">
              <div className="text-4xl transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">{f.icon}</div>
              <h3 className="mt-4 text-lg font-bold tracking-tight">{f.nameAr}</h3>
              <p className="text-xs text-muted-foreground">{f.name}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {f.subjects.slice(0, 4).map((s) => (
                  <span key={s.id} className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                    {s.nameAr}
                  </span>
                ))}
              </div>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                اعرض المواد
                <span className="transition-transform group-hover:-translate-x-1">←</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
