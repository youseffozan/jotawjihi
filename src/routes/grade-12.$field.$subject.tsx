import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getField, getSubject, type Field, type Subject } from "@/lib/exam-data";
import { ArrowLeft, BookOpenCheck, Layers, Lock } from "lucide-react";

export const Route = createFileRoute("/grade-12/$field/$subject")({
  loader: ({ params }): { field: Field; subject: Subject } => {
    const field = getField(params.field);
    const subject = getSubject(params.subject);
    if (!field || !subject) throw notFound();
    return { field, subject };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.subject.nameAr} — اختر نوع الامتحان | جو توجيهي` : "اختر نوع الامتحان" },
      { name: "description", content: "اختر بين الامتحانات الوزارية المجانية والامتحانات الأخرى للمادة." },
    ],
  }),
  component: SubjectOptionsPage,
});

function SubjectOptionsPage() {
  const { field, subject } = Route.useLoaderData() as { field: Field; subject: Subject };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-6 py-12">
        <Link
          to="/grade-12/$field"
          params={{ field: field.id }}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> العودة لـ {field.nameAr}
        </Link>

        <div className="mt-6 flex items-start gap-4">
          <div className={`grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br ${subject.color} text-3xl text-white shadow-lg`}>
            {subject.icon}
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">{subject.nameAr}</h1>
            <p className="mt-1 text-muted-foreground">{subject.name}</p>
          </div>
        </div>

        <p className="mt-8 text-muted-foreground">اختر نوع الامتحان الذي تريد التدرب عليه:</p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {/* Ministerial - Free */}
          <Link
            to="/exam/$subjectId"
            params={{ subjectId: subject.id }}
            className="group relative overflow-hidden rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-background to-emerald-500/5 p-8 transition hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/10"
          >
            <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-bold text-white shadow-lg">
              مجاني • Free
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
              <BookOpenCheck className="h-7 w-7" />
            </div>
            <h3 className="mt-6 text-2xl font-bold">الامتحانات الوزارية</h3>
            <p className="mt-1 text-sm text-muted-foreground">Ministerial Exams</p>
            <p className="mt-4 text-muted-foreground">
              امتحانات وزارية حقيقية معتمدة من وزارة التربية والتعليم الأردنية مع التصحيح الفوري وشرح الإجابات.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              ابدأ الآن
              <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
            </div>
          </Link>

          {/* Other Exams */}
          <div className="group relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-amber-500/10 via-background to-orange-500/5 p-8">
            <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-[11px] font-bold text-muted-foreground">
              <Lock className="h-3 w-3" /> قريباً
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30">
              <Layers className="h-7 w-7" />
            </div>
            <h3 className="mt-6 text-2xl font-bold">امتحانات أخرى</h3>
            <p className="mt-1 text-sm text-muted-foreground">Other Exams</p>
            <p className="mt-4 text-muted-foreground">
              امتحانات محاكية إضافية، نماذج مدارس، وامتحانات تدريبية متنوعة. ستتوفر قريباً بإذن الله.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              قيد التطوير
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
