import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { GraduationCap, Loader2, Users, MessageSquare, TrendingUp, Heart } from "lucide-react";

export const Route = createFileRoute("/teacher")({
  head: () => ({
    meta: [
      { title: "لوحة المعلم — جو توجيهي" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TeacherPage,
});

function TeacherPage() {
  const { user, isTeacher, isAdmin, loading } = useAuth();
  const [stats, setStats] = useState({ posts: 0, followers: 0, likes: 0, comments: 0 });
  const [students, setStudents] = useState<Array<{ id: string; name: string; attempts: number; avg: number }>>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!user || !(isTeacher || isAdmin)) return;
    (async () => {
      setBusy(true);
      const [{ data: posts }, { count: followers }, { data: attempts }, { data: profs }] = await Promise.all([
        supabase.from("teacher_posts").select("id").eq("author_id", user.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("followed_id", user.id),
        supabase.from("user_attempts").select("user_id, score, total"),
        supabase.from("profiles").select("id, first_name, last_name, full_name"),
      ]);
      const postIds = (posts ?? []).map((p) => p.id);
      const [{ count: likeCount }, { count: commentCount }] = postIds.length ? await Promise.all([
        supabase.from("post_likes").select("*", { count: "exact", head: true }).in("post_id", postIds),
        supabase.from("post_comments").select("*", { count: "exact", head: true }).in("post_id", postIds),
      ]) : [{ count: 0 }, { count: 0 }];

      setStats({ posts: postIds.length, followers: followers ?? 0, likes: likeCount ?? 0, comments: commentCount ?? 0 });

      const map = new Map<string, { attempts: number; pctSum: number }>();
      for (const a of attempts ?? []) {
        if (!a.total) continue;
        const prev = map.get(a.user_id) ?? { attempts: 0, pctSum: 0 };
        map.set(a.user_id, { attempts: prev.attempts + 1, pctSum: prev.pctSum + (a.score / a.total) * 100 });
      }
      const pMap = new Map((profs ?? []).map((p) => [p.id, p]));
      const list = [...map.entries()].map(([id, v]) => {
        const p = pMap.get(id);
        const name = [p?.first_name, p?.last_name].filter(Boolean).join(" ") || p?.full_name || "طالب";
        return { id, name, attempts: v.attempts, avg: Math.round((v.pctSum / v.attempts) * 10) / 10 };
      }).sort((a, b) => b.avg - a.avg).slice(0, 30);
      setStudents(list);
      setBusy(false);
    })();
  }, [user, isTeacher, isAdmin]);

  if (loading) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth" />;
  if (!isTeacher && !isAdmin) return <Navigate to="/" />;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-lg">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black">لوحة المعلم</h1>
            <p className="text-sm text-muted-foreground">نظرة على تفاعل الطلاب مع منشوراتك وأدائهم.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={MessageSquare} label="منشوراتي" value={stats.posts} />
          <Stat icon={Users} label="المتابعون" value={stats.followers} />
          <Stat icon={Heart} label="إجمالي الإعجابات" value={stats.likes} />
          <Stat icon={MessageSquare} label="إجمالي التعليقات" value={stats.comments} />
        </div>

        <div className="mt-8 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-black">أداء الطلاب</h2>
          </div>
          {busy ? (
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
          ) : students.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">لا توجد بيانات بعد.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr><th className="p-2 text-right">الطالب</th><th className="p-2 text-right">المحاولات</th><th className="p-2 text-right">المعدل</th><th className="p-2"></th></tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-t border-border/40">
                      <td className="p-2 font-semibold">{s.name}</td>
                      <td className="p-2">{s.attempts}</td>
                      <td className="p-2">{s.avg}%</td>
                      <td className="p-2 text-left"><Link to="/profile/$userId" params={{ userId: s.id }} className="text-xs text-primary hover:underline">عرض البروفايل</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="mt-2 text-2xl font-black">{value}</div>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
      </div>
    </div>
  );
}
