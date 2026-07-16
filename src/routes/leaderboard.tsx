import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Trophy, Medal, Award, Loader2 } from "lucide-react";
import { getLeaderboard, type LeaderboardEntry } from "@/lib/leaderboard.functions";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "لوحة الصدارة — جو توجيهي" },
      { name: "description", content: "أفضل الطلبة الأردنيين أداءً في الامتحانات الإلكترونية بناءً على معدل العلامات." },
    ],
  }),
  component: Leaderboard,
});

function gradeLabel(grade: string | null) {
  if (grade === "12") return "التوجيهي";
  if (grade === "11") return "الأول ثانوي";
  return "—";
}

function Leaderboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => getLeaderboard(),
  });

  const ranked: LeaderboardEntry[] = data ?? [];
  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-6 py-12">

        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xl shadow-amber-500/30">
            <Trophy className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">لوحة الصدارة</h1>
          <p className="mt-2 text-muted-foreground">الترتيب حسب معدل العلامات في الامتحانات المُنجزة</p>
        </div>

        {isLoading && (
          <div className="mt-16 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <p className="mt-16 text-center text-sm text-destructive">حدث خطأ أثناء تحميل لوحة الصدارة.</p>
        )}

        {!isLoading && !error && ranked.length === 0 && (
          <div className="mt-16 rounded-2xl border border-dashed border-border/60 bg-card p-12 text-center">
            <p className="text-lg font-semibold">لا توجد نتائج بعد</p>
            <p className="mt-2 text-sm text-muted-foreground">كن أول من يخوض امتحاناً ليظهر على لوحة الصدارة!</p>
          </div>
        )}

        {ranked.length > 0 && (
          <>
            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {top3.map((u, i) => {
                const config = [
                  { icon: Trophy, color: "from-amber-400 to-orange-500", ring: "ring-amber-400" },
                  { icon: Medal, color: "from-slate-300 to-slate-500", ring: "ring-slate-400" },
                  { icon: Award, color: "from-orange-500 to-red-600", ring: "ring-orange-500" },
                ][i];
                const Icon = config.icon;
                return (
                  <Link
                    key={u.userId}
                    to="/profile/$userId"
                    params={{ userId: u.userId }}
                    className={`group relative block rounded-3xl border border-border/60 bg-card p-6 text-center shadow-lg transition hover:-translate-y-1 hover:shadow-xl ${i === 0 ? "sm:scale-105 sm:shadow-2xl" : ""}`}
                  >
                    <div className={`mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br ${config.color} text-white ring-4 ${config.ring} ring-offset-4 ring-offset-background transition-transform group-hover:scale-110`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <div className="mt-3 text-xs font-bold text-muted-foreground">#{i + 1}</div>
                    <h3 className="mt-1 font-bold group-hover:text-primary">{u.name}</h3>
                    <p className="text-xs text-muted-foreground">صف {gradeLabel(u.grade)}</p>
                    <div className="mt-3 text-2xl font-black text-primary">
                      {u.averageScorePct}
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{u.examsCompleted} امتحان</div>
                  </Link>
                );
              })}
            </div>

            {rest.length > 0 && (
              <div className="mt-10 overflow-hidden rounded-2xl border border-border/60">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-right">
                      <th className="p-4 font-semibold">#</th>
                      <th className="p-4 font-semibold">الطالب</th>
                      <th className="hidden p-4 font-semibold sm:table-cell">الصف</th>
                      <th className="hidden p-4 font-semibold md:table-cell">الامتحانات</th>
                      <th className="p-4 text-left font-semibold">المعدل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rest.map((u, i) => (
                      <tr key={u.userId} className="border-t border-border/40 transition hover:bg-muted/30">
                        <td className="p-4 font-bold text-muted-foreground">{i + 4}</td>
                        <td className="p-4 font-semibold">
                          <Link to="/profile/$userId" params={{ userId: u.userId }} className="hover:text-primary hover:underline">
                            {u.name}
                          </Link>
                        </td>
                        <td className="hidden p-4 text-muted-foreground sm:table-cell">{gradeLabel(u.grade)}</td>
                        <td className="hidden p-4 text-muted-foreground md:table-cell">{u.examsCompleted}</td>
                        <td className="p-4 text-left font-bold text-primary">{u.averageScorePct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
