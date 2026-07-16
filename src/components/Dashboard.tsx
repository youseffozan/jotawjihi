import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocalProgress } from "@/lib/local-progress";
import { Trophy, BookOpen, Clock, TrendingUp } from "lucide-react";

export function Dashboard() {
  const { progress } = useLocalProgress();

  const recentAttempts = progress.attempts.slice(0, 5);

  const stats = [
    {
      label: "المعدل العام",
      value: `${Math.round(progress.overallAverage)}%`,
      icon: <TrendingUp className="h-6 w-6 text-primary" />,
    },
    {
      label: "عدد الامتحانات المنجزة",
      value: progress.totalExamsCompleted,
      icon: <Trophy className="h-6 w-6 text-primary" />,
    },
    {
      label: "إجمالي الأسئلة",
      value: Object.values(progress.subjectProgress).reduce((sum, sp) => sum + sp.totalQuestionsAnswered, 0),
      icon: <BookOpen className="h-6 w-6 text-primary" />,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center animate-fade-up">
        <h1 className="text-4xl font-bold mb-2">لوحة التحكم</h1>
        <p className="text-muted-foreground">تابع تقدمك في التوجيهي</p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index} className="border-border/60 bg-card animate-fade-up" style={{ animationDelay: `${index * 100}ms` }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent attempts */}
      {recentAttempts.length > 0 && (
        <Card className="border-border/60 bg-card animate-fade-up" style={{ animationDelay: "300ms" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              آخر الامتحانات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAttempts.map((attempt, idx) => (
                <div key={attempt.id} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/30">
                  <div>
                    <div className="font-bold">{attempt.subjectName}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(attempt.completedAt).toLocaleDateString("ar-EG")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${attempt.score >= 60 ? 'text-primary' : 'text-destructive'}`}>
                      {attempt.score}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {attempt.correctAnswers} / {attempt.totalQuestions} صحيحة
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {recentAttempts.length === 0 && (
        <Card className="border-border/60 bg-muted/30 animate-fade-up" style={{ animationDelay: "300ms" }}>
          <CardContent className="pt-8 pb-8 text-center">
            <BookOpen className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold mb-2">ابدأ الآن!</h3>
            <p className="text-muted-foreground">
              ابدأ بحل الامتحانات لترى تقدمك هنا
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
