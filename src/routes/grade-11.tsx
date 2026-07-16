import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, BookOpen, PlayCircle } from "lucide-react";
import { grade11Subjects } from "@/lib/exam-data";
import { QuizEngine } from "@/components/QuizEngine";
import { useLocalProgress } from "@/lib/local-progress";

export const Route = createFileRoute("/grade-11")({
  head: () => ({
    meta: [
      { title: "الأول ثانوي — جو توجيهي" },
      { name: "description", content: "امتحانات محاكية لطلاب الأول ثانوي في الأردن." },
    ],
  }),
  component: Grade11Page,
});

function Grade11Page() {
  const { progress } = useLocalProgress();
  const [activeSubject, setActiveSubject] = useState<string | null>(null);

  if (activeSubject) {
    const subject = grade11Subjects.find((s) => s.id === activeSubject)!;
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
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <BookOpen className="h-3.5 w-3.5" /> الأول ثانوي
          </div>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            اختر المبحث الذي تريد التدرب عليه
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            المواد الأساسية لطلاب الصف الحادي عشر. اختر المادة للبدء بامتحان.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {grade11Subjects.map((subject, idx) => {
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
