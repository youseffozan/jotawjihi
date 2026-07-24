import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { type Field } from "@/lib/exam-data";
import { isSubjectAvailable, useSubjectStatuses } from "@/lib/available-subjects";
import { SubjectCard } from "@/components/SubjectCard";
import { ArrowLeft } from "lucide-react";
import { Route as FieldRoute } from "./grade-12.$field";

export const Route = createFileRoute("/grade-12/$field/")({
  component: FieldIndexPage,
});

function FieldIndexPage() {
  const { field } = FieldRoute.useLoaderData() as { field: Field };
  const statuses = useSubjectStatuses();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-6 py-12">
        <Link to="/grade-12" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4 transition-transform hover:-translate-x-1" /> عودة للحقول
        </Link>
        <div className="mt-6 animate-fade-up">
          <div className="text-5xl animate-float">{field.icon}</div>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">{field.nameAr}</h1>
          <p className="mt-2 text-muted-foreground">{field.name}</p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {field.subjects.map((s, i) => (
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
              to="/grade-12/$field/$subject"
              params={{ field: field.id, subject: s.id }}
            />
          ))}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

