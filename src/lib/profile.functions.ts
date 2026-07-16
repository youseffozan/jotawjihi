import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type PublicSubjectStat = {
  subjectId: string;
  subjectName: string;
  bestScorePct: number;
  attempts: number;
};

export type PublicProfile = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  grade: string | null;
  field: string | null;
  memberSince: string;
  totalAttempts: number;
  averageScorePct: number;
  bestScorePct: number;
  subjectsPracticed: number;
  perfectScores: number;
  subjects: PublicSubjectStat[];
};

export const getPublicProfile = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, first_name, last_name, full_name, grade, field, created_at")
      .eq("id", data.userId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!profile) throw new Error("Profile not found");

    const { data: attempts, error: aErr } = await supabaseAdmin
      .from("user_attempts")
      .select("subject_id, score, total")
      .eq("user_id", data.userId);
    if (aErr) throw new Error(aErr.message);

    const attemptsList = attempts ?? [];
    const subjectIds = [...new Set(attemptsList.map((a) => a.subject_id))];

    let subjectNames = new Map<string, string>();
    if (subjectIds.length) {
      const { data: subjects } = await supabaseAdmin
        .from("subjects")
        .select("id, name_ar")
        .in("id", subjectIds);
      subjectNames = new Map((subjects ?? []).map((s) => [s.id, s.name_ar]));
    }

    // per-subject best percentage
    const bestBySubject = new Map<string, { best: number; count: number }>();
    let sumPct = 0;
    let cnt = 0;
    let bestOverall = 0;
    let perfects = 0;
    for (const a of attemptsList) {
      if (!a.total || a.total <= 0) continue;
      const pct = Math.min(100, (a.score / a.total) * 100);
      sumPct += pct;
      cnt += 1;
      if (pct > bestOverall) bestOverall = pct;
      if (pct >= 100) perfects += 1;
      const prev = bestBySubject.get(a.subject_id) ?? { best: 0, count: 0 };
      bestBySubject.set(a.subject_id, {
        best: Math.max(prev.best, pct),
        count: prev.count + 1,
      });
    }

    const subjects: PublicSubjectStat[] = [...bestBySubject.entries()]
      .map(([id, v]) => ({
        subjectId: id,
        subjectName: subjectNames.get(id) ?? id,
        bestScorePct: Math.round(v.best * 10) / 10,
        attempts: v.count,
      }))
      .sort((a, b) => b.bestScorePct - a.bestScorePct);

    const result: PublicProfile = {
      userId: profile.id,
      firstName: (profile.first_name ?? null) as string | null,
      lastName: (profile.last_name ?? null) as string | null,
      grade: (profile.grade as string | null) ?? null,
      field: (profile.field as string | null) ?? null,
      memberSince: profile.created_at as unknown as string,
      totalAttempts: cnt,
      averageScorePct: cnt ? Math.round((sumPct / cnt) * 10) / 10 : 0,
      bestScorePct: Math.round(bestOverall * 10) / 10,
      subjectsPracticed: bestBySubject.size,
      perfectScores: perfects,
      subjects,
    };

    // If both first_name and last_name are missing, derive from full_name.
    if (!result.firstName && !result.lastName && profile.full_name) {
      const parts = profile.full_name.trim().split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        result.firstName = parts[0];
        result.lastName = parts[parts.length - 1];
      } else if (parts.length === 1) {
        result.firstName = parts[0];
      }
    }

    return result;
  });
