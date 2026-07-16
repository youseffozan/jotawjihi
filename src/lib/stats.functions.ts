import { createServerFn } from "@tanstack/react-start";

export type LandingStats = {
  activeStudents: number;
  totalExams: number;
  completedExams: number;
};

export const getLandingStats = createServerFn({ method: "GET" }).handler(async (): Promise<LandingStats> => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [students, subjects, attempts] = await Promise.all([
    supabaseAdmin.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "student"),
    supabaseAdmin.from("subjects").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("user_attempts").select("*", { count: "exact", head: true }),
  ]);

  return {
    activeStudents: students.count ?? 0,
    totalExams: subjects.count ?? 0,
    completedExams: attempts.count ?? 0,
  };
});
