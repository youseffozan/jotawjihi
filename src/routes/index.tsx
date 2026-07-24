import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Timer, BarChart3, Trophy, Sparkles, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { formatDisplayName } from "@/lib/display-name";
import { getLandingStats } from "@/lib/stats.functions";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function formatCount(n: number) {
  if (n >= 1000) return `+${Math.floor(n / 100) / 10}K`;
  return String(n);
}

function LandingPage() {
  const { user, profile } = useAuth();
  const { data: stats } = useQuery({
    queryKey: ["landing-stats"],
    queryFn: () => getLandingStats(),
    staleTime: 60_000,
  });

  const displayName = formatDisplayName({
    first_name: profile?.first_name,
    last_name: profile?.last_name,
    full_name: profile?.full_name,
    email: user?.email,
  });
  const gradeHref = profile?.grade === "12" ? "/grade-12" : "/grade-11";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.12),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-6 pb-16 pt-20 md:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-4 py-1.5 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              منصّة الامتحانات الإلكترونية الأولى في الأردن
            </div>

            {user ? (
              <>
                <h1 className="mt-6 text-4xl font-black tracking-tight md:text-6xl">
                  أهلاً بك،
                  <span className="mt-2 block bg-gradient-to-l from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent">
                    {displayName}
                  </span>
                </h1>
                <p className="mt-6 text-lg text-muted-foreground md:text-xl">
                  {profile?.grade
                    ? "استكمل تدريبك على امتحانات صفّك وتابع تقدمك من هنا."
                    : "أضف صفّك الدراسي من إعدادات الحساب لنعرض لك امتحاناتك المناسبة."}
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Button asChild size="lg" className="h-12 px-6 text-base">
                    <Link to={gradeHref}>ابدأ التدريب</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
                    <Link to="/leaderboard">لوحة الصدارة</Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h1 className="mt-6 text-4xl font-black tracking-tight md:text-6xl">
                  استعد للتوجيهي بثقة
                  <span className="mt-2 block bg-gradient-to-l from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent">
                    امتحانات محاكية لكل المواد
                  </span>
                </h1>
                <p className="mt-6 text-lg text-muted-foreground md:text-xl">
                  منصّة متكاملة لطلاب الأول ثانوي والثاني ثانوي بجميع المسارات الأكاديمية الجديدة. تدرّب، اختبر نفسك، وراقب تقدمك بأسلوب علمي حديث.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Button asChild size="lg" className="h-12 px-6 text-base">
                    <Link to="/auth" search={{ mode: "signup" as const }}>ابدأ مجاناً</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
                    <Link to="/auth">تسجيل الدخول</Link>
                  </Button>
                </div>
              </>
            )}

            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-border/40 pt-8 sm:gap-12">
              {[
                { v: formatCount(stats?.activeStudents ?? 0), l: "طالب مسجّل" },
                { v: formatCount(stats?.totalExams ?? 0), l: "مبحث دراسي" },
                { v: formatCount(stats?.completedExams ?? 0), l: "امتحان مُنجز" },
              ].map((s, i) => (
                <div key={s.l} className="animate-fade-up" style={{ animationDelay: `${150 + i * 80}ms` }}>
                  <div className="text-shimmer text-2xl font-black md:text-4xl">{s.v}</div>
                  <div className="mt-1 text-xs text-muted-foreground md:text-sm">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Categories */}
      <section className="mx-auto max-w-7xl px-6 py-16" id="grades">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-black tracking-tight md:text-4xl">اختر صفّك الدراسي</h2>
          <p className="mt-3 text-muted-foreground">فئتان رئيسيتان تغطيان كامل المنهاج الأردني الحديث</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Link
            to="/grade-11"
            className="card-interactive group relative isolate overflow-hidden rounded-3xl border border-border/60 bg-linear-to-br from-blue-500/10 via-background to-indigo-500/10 p-8 animate-fade-up hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10"
          >
            <div className="absolute -left-8 -top-8 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl transition-all duration-500 group-hover:scale-125 group-hover:bg-blue-500/40" />
            <div className="relative">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                <BookOpen className="h-7 w-7" />
              </div>
              <h3 className="mt-6 text-2xl font-bold tracking-tight">الأول ثانوي</h3>
              <p className="mt-1 text-sm text-muted-foreground">الصف الحادي عشر</p>
              <p className="mt-4 text-muted-foreground">4 مواد أساسية: الدين، تاريخ الأردن، الرياضيات، واللغة العربية.</p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                استكشف المواد
                <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-2" />
              </div>
            </div>
          </Link>

          <Link
            to="/grade-12"
            className="card-interactive group relative isolate overflow-hidden rounded-3xl border border-border/60 bg-linear-to-br from-purple-500/10 via-background to-pink-500/10 p-8 animate-fade-up hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10"
            style={{ animationDelay: "100ms" }}
          >
            <div className="absolute -left-8 -top-8 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl transition-all duration-500 group-hover:scale-125 group-hover:bg-purple-500/40" />
            <div className="relative">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-linear-to-br from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/30 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3">
                <GraduationCap className="h-7 w-7" />
              </div>
              <h3 className="mt-6 text-2xl font-bold tracking-tight">الثاني ثانوي — التوجيهي</h3>
              <p className="mt-1 text-sm text-muted-foreground">المسار الأكاديمي الجديد</p>
              <p className="mt-4 text-muted-foreground">6 حقول أكاديمية: الطبي، الهندسي، العلوم والتكنولوجيا، اللغات، القانون، والأعمال.</p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                اختر حقلك
                <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-2" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-black md:text-4xl">لماذا منصّتنا؟</h2>
            <p className="mt-3 text-muted-foreground">أدوات مصممة للطالب الأردني الحديث</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Timer, title: "امتحانات مؤقتة", desc: "تدرّب على إدارة الوقت كما في الامتحان الحقيقي." },
              { icon: BarChart3, title: "تحليل الأداء", desc: "رسوم بيانية تفصيلية لنقاط قوتك وضعفك." },
              { icon: CheckCircle2, title: "تصحيح فوري", desc: "نتائجك وشرح الإجابات بمجرد الانتهاء." },
              { icon: Trophy, title: "لوحة الصدارة", desc: "نافس الطلبة من كل أنحاء المملكة." },
            ].map((f, i) => (
              <div
                key={f.title}
                className="card-interactive group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 animate-fade-up hover:border-primary/40 hover:shadow-lg"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="mx-auto max-w-4xl px-6 py-20 text-center">
          <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-primary/5 p-10">
            <h2 className="text-3xl font-black md:text-4xl">جاهز لتبدأ رحلة التفوق؟</h2>
            <p className="mt-3 text-muted-foreground">انضم لآلاف الطلبة الأردنيين وابدأ التدريب اليوم.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/auth" search={{ mode: "signup" as const }}>إنشاء حساب مجاني</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/pricing">مقارنة الاشتراكات</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}
