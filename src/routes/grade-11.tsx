import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { grade11Subjects } from "@/lib/exam-data";
import { isSubjectAvailable, useSubjectStatuses } from "@/lib/available-subjects";
import { SubjectCard } from "@/components/SubjectCard";
import { ArrowLeft, BookOpen } from "lucide-react";

export const Route = createFileRoute("/grade-11")({
  head: () => ({
    meta: [
      { title: "الأول ثانوي — جو توجيهي" },
      { name: "description", content: "امتحانات محاكية لطلاب الأول ثانوي في الأردن: الدين، تاريخ الأردن، الرياضيات، واللغة العربية." },
    ],
  }),
  component: Grade11Page,
});

function Grade11Page() {
  const statuses = useSubjectStatuses();
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
            4 مواد أساسية لطلاب الصف الحادي عشر. كل مادة تحتوي على امتحان محاكي مع تصحيح فوري وشرح للإجابات.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {grade11Subjects.map((s, i) => (
            <SubjectCard
              key={s.id}
              id={s.id}
              nameAr={s.nameAr}
              nameEn={s.name}
              icon={s.icon}
              color={s.color}
              questionsCount={s.questions.length}
              available={isSubjectAvailable(s.id, statuses)}
              index={i}
              to="/exam/$subjectId"
              params={{ subjectId: s.id }}
            />
          ))}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

