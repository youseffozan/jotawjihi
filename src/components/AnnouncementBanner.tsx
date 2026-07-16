import { useEffect, useState } from "react";
import { X, Info, AlertTriangle, CheckCircle2, AlertOctagon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Announcement = { id: string; message: string; level: string };

const LEVEL_STYLES: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-800 dark:text-blue-200 border-blue-500/30",
  success: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border-emerald-500/30",
  warning: "bg-amber-500/10 text-amber-800 dark:text-amber-200 border-amber-500/30",
  danger: "bg-red-500/10 text-red-800 dark:text-red-200 border-red-500/30",
};

const LEVEL_ICON: Record<string, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertOctagon,
};

export function AnnouncementBanner() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      return new Set(JSON.parse(localStorage.getItem("jt-dismissed-banners") ?? "[]"));
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    supabase
      .from("announcements")
      .select("id, message, level")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => setItems((data ?? []) as Announcement[]));
  }, []);

  const visible = items.filter((a) => !dismissed.has(a.id));
  if (!visible.length) return null;

  const dismiss = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    try {
      localStorage.setItem("jt-dismissed-banners", JSON.stringify([...next]));
    } catch { /* ignore */ }
  };

  return (
    <div className="w-full">
      {visible.map((a) => {
        const Icon = LEVEL_ICON[a.level] ?? Info;
        const cls = LEVEL_STYLES[a.level] ?? LEVEL_STYLES.info;
        return (
          <div key={a.id} className={`border-b ${cls}`}>
            <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 text-sm sm:px-6">
              <Icon className="h-4 w-4 flex-shrink-0" />
              <div className="min-w-0 flex-1 font-medium">{a.message}</div>
              <button
                onClick={() => dismiss(a.id)}
                className="rounded p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
                aria-label="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
