// Subject availability is now controlled from the admin dashboard via the
// `subjects.status` column: 'available' | 'locked' | 'coming_soon'.
// This file exposes a tiny in-memory cache + React hook so the frontend can
// gate UI without every page having to refetch.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SubjectStatus = "available" | "locked" | "coming_soon";

// Legacy fallback for any code path that runs before we've fetched the DB.
const LEGACY_AVAILABLE = new Set<string>([
  "bus-eng",
  "eng-math",
  "lang-eng",
  "med-eng",
  "st-math",
]);

let cache: Map<string, SubjectStatus> | null = null;
let inflight: Promise<Map<string, SubjectStatus>> | null = null;
const listeners = new Set<(m: Map<string, SubjectStatus>) => void>();

async function fetchStatuses(): Promise<Map<string, SubjectStatus>> {
  if (inflight) return inflight;
  inflight = (async () => {
    const { data } = await supabase.from("subjects").select("id, status, is_available");
    const m = new Map<string, SubjectStatus>();
    for (const s of data ?? []) {
      const raw = (s as { status?: string | null }).status;
      if (raw === "available" || raw === "locked" || raw === "coming_soon") {
        m.set(s.id, raw);
      } else {
        m.set(s.id, s.is_available ? "available" : "coming_soon");
      }
    }
    cache = m;
    for (const fn of listeners) fn(m);
    return m;
  })();
  return inflight;
}

/** Invalidate the cache so the next hook read pulls fresh data. */
export function invalidateSubjectStatuses() {
  cache = null;
  inflight = null;
  void fetchStatuses();
}

export function useSubjectStatuses(): Map<string, SubjectStatus> {
  const [map, setMap] = useState<Map<string, SubjectStatus>>(() => cache ?? new Map());
  useEffect(() => {
    let mounted = true;
    fetchStatuses().then((m) => mounted && setMap(new Map(m)));
    const fn = (m: Map<string, SubjectStatus>) => mounted && setMap(new Map(m));
    listeners.add(fn);
    return () => {
      mounted = false;
      listeners.delete(fn);
    };
  }, []);
  return map;
}

export function getSubjectStatus(id: string, map?: Map<string, SubjectStatus>): SubjectStatus {
  const m = map ?? cache;
  const s = m?.get(id);
  if (s) return s;
  return LEGACY_AVAILABLE.has(id) ? "available" : "coming_soon";
}

/** Back-compat: keep the same signature the codebase already uses. */
export function isSubjectAvailable(id: string, map?: Map<string, SubjectStatus>): boolean {
  return getSubjectStatus(id, map) === "available";
}

export const AVAILABLE_SUBJECT_IDS = LEGACY_AVAILABLE;
