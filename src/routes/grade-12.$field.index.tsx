import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, PlayCircle } from "lucide-react";
import { Route as FieldRoute } from "./grade-12.$field";
import { type Field } from "@/lib/exam-data";
import { QuizEngine } from "@/components/QuizEngine";
import { useLocalProgress } from "@/lib/local-progress";

export const Route = createFileRoute("/grade-12/$field/")({
  component: FieldIndexPage,
});

function FieldIndexPage() {
  const { field } = FieldRoute.useLoaderData() as { field: Field };
  const { progress } = useLocalProgress();
  const [activeSubject, setActiveSubject] = useState<string | null>(null);

  if (activeSubject) {
    const subject = field.subjects.find((s) => s.id === activeSubject)!;
    return (
      <QuizEngine
        subjectId={subject.id}
        subjectName={subject.nameAr}
        questions={subject.questions}
        onExit={() => setActiveSubject(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4 transition-transform hover:-translate-x-1" /> العودة للرئيسية
        </Link>
        <div className="mt-6 animate-fade-up">
          <div className="text-5xl animate-float">{field.icon}</div>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">{field.nameAr}</h1>
          <p className="mt-2 text-muted-foreground">{field.name}</p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {field.subjects.map((subject, idx) => {
            const subjectProgress = progress.subjectProgress[subject.id];
            return (
              <button
                key={subject.id}
                onClick={() => setActiveSubject(subject.id)}
                className="relative border border-border bg-card rounded-xl p-6 card-interactive text-right animate-fade-up"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold">{subject.nameAr}</h3>
                    {subjectProgress ? (
                      <p className="text-sm text-muted-foreground mt-1">أفضل نتيجة: {subjectProgress.bestScore}%</p>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">لم تحل هذا الامتحان بعد</p>
                    )}
                  </div>
                  <PlayCircle className="w-8 h-8 text-primary" />
                </div>
                <div className="mt-4">
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${subjectProgress ? Math.min(subjectProgress.bestScore, 100) : 0}%` }}
                    />
                  </div>
                </div>
                <div className="mt-6 w-full py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors text-center">
                  ابدأ الامتحان الآن
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
