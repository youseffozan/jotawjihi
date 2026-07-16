import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AnalyticsData = {
  weeklyActivity: { day: string; users: number; exams: number; avgScore: number }[];
  subjectPopularity: { name: string; value: number }[];
  monthlyRevenue: { month: string; revenue: number }[];
  completionRatePct: number;
};

const PRICE: Record<string, number> = { free: 0, premium: 9.99, pro: 79.99 };
const AR_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const AR_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

export const getAdminAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AnalyticsData> => {
    try {
      const { data: rows } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin");
      if (!rows || rows.length === 0) throw new Error("Forbidden");

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      const yearAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

      const [profilesRes, attemptsWeekRes, attemptsAllRes, subjectsRes] = await Promise.all([
        supabaseAdmin.from("profiles").select("created_at, subscription").gte("created_at", yearAgo.toISOString()),
        supabaseAdmin.from("user_attempts").select("created_at, score, total, subject_id").gte("created_at", weekAgo.toISOString()),
        supabaseAdmin.from("user_attempts").select("score, total, subject_id"),
        supabaseAdmin.from("subjects").select("id, name_ar"),
      ]);

      const profiles = profilesRes.data ?? [];
      const attemptsWeek = attemptsWeekRes.data ?? [];
      const attemptsAll = attemptsAllRes.data ?? [];
      const subjects = subjectsRes.data ?? [];

      // Weekly activity — last 7 days
      const weeklyActivity: AnalyticsData["weeklyActivity"] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const next = new Date(d);
        next.setDate(next.getDate() + 1);

        const dayUsers = profiles.filter((p) => {
          const t = new Date(p.created_at).getTime();
          return t >= d.getTime() && t < next.getTime();
        }).length;

        const dayAttempts = attemptsWeek.filter((a) => {
          const t = new Date(a.created_at).getTime();
          return t >= d.getTime() && t < next.getTime();
        });

        const avgScore = dayAttempts.length
          ? Math.round((dayAttempts.reduce((s, a) => s + (a.total > 0 ? (a.score / a.total) * 100 : 0), 0) / dayAttempts.length))
          : 0;

        weeklyActivity.push({
          day: AR_DAYS[d.getDay()],
          users: dayUsers,
          exams: dayAttempts.length,
          avgScore,
        });
      }

      // Subject popularity
      const nameById = new Map(subjects.map((s) => [s.id, s.name_ar]));
      const countBySubject = new Map<string, number>();
      for (const a of attemptsAll) {
        countBySubject.set(a.subject_id, (countBySubject.get(a.subject_id) ?? 0) + 1);
      }
      const subjectPopularity = Array.from(countBySubject.entries())
        .map(([id, value]) => ({ name: nameById.get(id) ?? id, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      // Monthly revenue — last 6 months, from profile subscriptions bucketed by created_at month
      const monthlyRevenue: AnalyticsData["monthlyRevenue"] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const revenue = profiles
          .filter((p) => {
            const t = new Date(p.created_at).getTime();
            return t >= d.getTime() && t < next.getTime();
          })
          .reduce((s, p) => s + (PRICE[p.subscription] ?? 0), 0);
        monthlyRevenue.push({ month: AR_MONTHS[d.getMonth()], revenue: Math.round(revenue * 100) / 100 });
      }

      // Completion rate = avg score % across all attempts
      const totalAttempts = attemptsAll.length;
      const completionRatePct = totalAttempts
        ? Math.round(attemptsAll.reduce((s, a) => s + (a.total > 0 ? (a.score / a.total) * 100 : 0), 0) / totalAttempts)
        : 0;

      return { weeklyActivity, subjectPopularity, monthlyRevenue, completionRatePct };
    } catch (error) {
      console.warn("Using dummy analytics because Supabase is not configured:", error);
      // Return dummy analytics
      return {
        weeklyActivity: [],
        subjectPopularity: [],
        monthlyRevenue: [],
        completionRatePct: 0,
      };
    }
  });
