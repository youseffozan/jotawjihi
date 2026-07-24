import { createServerFn } from "@tanstack/react-start";

export type LeaderboardEntry = {
  userId: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  grade: string | null;
  field: string | null;
  averageScorePct: number;
  examsCompleted: number;
};

export const getLeaderboard = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Only grade 11 subjects count toward the leaderboard.
  const { data: subjects, error: subjectsError } = await supabaseAdmin
    .from("subjects")
    .select("id")
    .eq("grade", "11");
  if (subjectsError) throw new Error(subjectsError.message);

  const grade11SubjectIds = (subjects ?? []).map((s) => s.id);
  if (grade11SubjectIds.length === 0) return [] as LeaderboardEntry[];

  const { data: attempts, error: attemptsError } = await supabaseAdmin
    .from("user_attempts")
    .select("user_id, subject_id, score, total")
    .in("subject_id", grade11SubjectIds);
  if (attemptsError) throw new Error(attemptsError.message);

  // Keep only the highest percentage per (user, subject).
  const best = new Map<string, number>(); // key: userId::subjectId -> pct
  for (const a of attempts ?? []) {
    if (!a.total || a.total <= 0) continue;
    const pct = Math.min(100, (a.score / a.total) * 100);
    const key = `${a.user_id}::${a.subject_id}`;
    const prev = best.get(key);
    if (prev === undefined || pct > prev) best.set(key, pct);
  }

  const agg = new Map<string, { sumPct: number; count: number }>();
  for (const [key, pct] of best) {
    const uid = key.split("::")[0];
    const cur = agg.get(uid) ?? { sumPct: 0, count: 0 };
    cur.sumPct += pct;
    cur.count += 1;
    agg.set(uid, cur);
  }

  const userIds = [...agg.keys()];
  if (userIds.length === 0) return [] as LeaderboardEntry[];

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, first_name, last_name, grade, field")
    .in("id", userIds);
  if (profilesError) throw new Error(profilesError.message);


  const byId = new Map(profiles?.map((p) => [p.id, p]) ?? []);

  const entries: LeaderboardEntry[] = userIds.map((uid) => {
    const a = agg.get(uid)!;
    const p = byId.get(uid);
    let firstName = (p?.first_name ?? null) as string | null;
    let lastName = (p?.last_name ?? null) as string | null;
    if (!firstName && !lastName && p?.full_name) {
      const parts = p.full_name.trim().split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        firstName = parts[0];
        lastName = parts[parts.length - 1];
      } else if (parts.length === 1) {
        firstName = parts[0];
      }
    }
    const displayName = [firstName, lastName].filter(Boolean).join(" ") || "طالب";
    return {
      userId: uid,
      name: displayName,
      firstName,
      lastName,
      grade: (p?.grade as string | null) ?? null,
      field: (p?.field as string | null) ?? null,
      averageScorePct: Math.round((a.sumPct / a.count) * 10) / 10,
      examsCompleted: a.count,
    };
  });

  entries.sort((x, y) => y.averageScorePct - x.averageScorePct);
  return entries;
});
