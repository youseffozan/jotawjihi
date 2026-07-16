import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Trophy, Target, Sparkles, BookOpen, Calendar, Award, Loader2, UserRound, ArrowLeft } from "lucide-react";
import { getPublicProfile } from "@/lib/profile.functions";
import { getInitials } from "@/lib/display-name";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/profile/$userId")({
  head: ({ params }) => ({
    meta: [
      { title: "بروفايل الطالب — جو توجيهي" },
      { name: "description", content: `عرض إنجازات ونتائج الطالب على منصة جو توجيهي.` },
      { property: "og:title", content: "بروفايل الطالب — جو توجيهي" },
      { property: "og:description", content: "شاهد أداء الطالب في الامتحانات الإلكترونية على منصة جو توجيهي." },
      { property: "og:type", content: "profile" },
    ],
    links: [{ rel: "canonical", href: `https://jotawjihi.com/profile/${params.userId}` }],
  }),
  component: ProfilePage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="text-2xl font-black">تعذّر تحميل البروفايل</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <Link to="/leaderboard" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> العودة إلى لوحة الصدارة
        </Link>
      </div>
      <SiteFooter />
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="text-2xl font-black">البروفايل غير موجود</h1>
        <Link to="/leaderboard" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> العودة إلى لوحة الصدارة
        </Link>
      </div>
      <SiteFooter />
    </div>
  ),
});

function gradeLabel(grade: string | null) {
  if (grade === "12") return "التوجيهي";
  if (grade === "11") return "الأول ثانوي";
  return "—";
}
function fieldLabel(field: string | null) {
  if (!field) return null;
  const map: Record<string, string> = {
    scientific: "علمي",
    literary: "أدبي",
    it: "معلوماتية",
    industrial: "صناعي",
    agricultural: "زراعي",
    hospitality: "فندقي",
    home_economics: "اقتصاد منزلي",
    sharia: "شرعي",
  };
  return map[field] ?? field;
}

function ProfilePage() {
  const { userId } = Route.useParams();
  const { user } = useAuth();
  const isSelf = user?.id === userId;

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-profile", userId],
    queryFn: () => getPublicProfile({ data: { userId } }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto flex max-w-5xl justify-center px-6 py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (error || !data) throw notFound();

  const displayName = [data.firstName, data.lastName].filter(Boolean).join(" ") || "طالب";
  const initials = getInitials(displayName);
  const memberSince = data.memberSince
    ? new Date(data.memberSince).toLocaleDateString("ar-EG", { month: "long", year: "numeric" })
    : "—";

  const badges: Array<{ icon: typeof Trophy; label: string; color: string }> = [];
  if (data.perfectScores > 0) badges.push({ icon: Sparkles, label: `${data.perfectScores}× علامة كاملة`, color: "from-amber-400 to-orange-500" });
  if (data.bestScorePct >= 90) badges.push({ icon: Trophy, label: "متفوّق", color: "from-yellow-400 to-amber-500" });
  if (data.totalAttempts >= 10) badges.push({ icon: Target, label: "مثابر", color: "from-emerald-400 to-teal-500" });
  if (data.subjectsPracticed >= 3) badges.push({ icon: BookOpen, label: "متعدد المواد", color: "from-sky-400 to-indigo-500" });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Header card */}
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-xl sm:p-10 animate-fade-up">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-[#007A3D]/20 blur-3xl" />

          <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:text-right">
            <div className="relative">
              <div className="grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-[#007A3D] via-primary to-[#CE1126] text-4xl font-black text-white shadow-2xl shadow-primary/30 ring-4 ring-background transition-transform hover:scale-105">
                {initials.toUpperCase()}
              </div>
              <span className="absolute -bottom-1 -left-1 grid h-9 w-9 place-items-center rounded-full border-4 border-background bg-amber-400 text-white shadow-lg">
                <UserRound className="h-4 w-4" />
              </span>
            </div>

            <div className="flex-1 text-center sm:text-right">
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{displayName}</h1>
              <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  صف {gradeLabel(data.grade)}
                </span>
                {fieldLabel(data.field) && (
                  <span className="rounded-full bg-accent/50 px-3 py-1 text-xs font-bold">
                    {fieldLabel(data.field)}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  <Calendar className="h-3 w-3" /> عضو منذ {memberSince}
                </span>
              </div>

              {badges.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                  {badges.map((b, i) => (
                    <span
                      key={i}
                      style={{ animationDelay: `${i * 80}ms` }}
                      className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${b.color} px-3 py-1 text-xs font-bold text-white shadow-md animate-pop-in`}
                    >
                      <b.icon className="h-3.5 w-3.5" /> {b.label}
                    </span>
                  ))}
                </div>
              )}

              {isSelf && (
                <div className="mt-4">
                  <Link
                    to="/account"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    تعديل بياناتي
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "المعدل العام", value: `${data.averageScorePct}%`, icon: Trophy, tint: "from-primary/20 to-primary/5", accent: "text-primary" },
            { label: "أعلى علامة", value: `${data.bestScorePct}%`, icon: Award, tint: "from-amber-500/20 to-amber-500/5", accent: "text-amber-600 dark:text-amber-400" },
            { label: "امتحانات مُنجزة", value: data.totalAttempts, icon: Target, tint: "from-emerald-500/20 to-emerald-500/5", accent: "text-emerald-600 dark:text-emerald-400" },
            { label: "مواد تم التدرّب عليها", value: data.subjectsPracticed, icon: BookOpen, tint: "from-sky-500/20 to-sky-500/5", accent: "text-sky-600 dark:text-sky-400" },
          ].map((s, i) => (
            <div
              key={s.label}
              style={{ animationDelay: `${i * 60}ms` }}
              className={`relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br ${s.tint} p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg animate-fade-up`}
            >
              <s.icon className={`absolute -bottom-3 -left-3 h-16 w-16 opacity-10 ${s.accent}`} />
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</div>
              <div className={`mt-2 text-3xl font-black ${s.accent}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Subjects breakdown */}
        <div className="mt-8 rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-8 animate-fade-up" style={{ animationDelay: "200ms" }}>
          <div className="mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-black">الأداء حسب المادة</h2>
          </div>
          {data.subjects.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">لا توجد امتحانات مُنجزة بعد.</p>
          ) : (
            <div className="space-y-3">
              {data.subjects.map((s, i) => (
                <div
                  key={s.subjectId}
                  style={{ animationDelay: `${i * 50}ms` }}
                  className="group flex items-center gap-4 rounded-xl border border-border/50 bg-background/40 p-4 transition hover:border-primary/40 hover:bg-primary/5 animate-fade-up"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{s.subjectName}</span>
                      <span className="text-sm font-black text-primary">{s.bestScorePct}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#007A3D] via-primary to-[#CE1126] transition-all"
                        style={{ width: `${s.bestScorePct}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{s.attempts} محاولة</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <Link to="/leaderboard" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> العودة إلى لوحة الصدارة
          </Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
