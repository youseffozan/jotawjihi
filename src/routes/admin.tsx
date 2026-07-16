import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { grade12Fields } from "@/lib/exam-data";
import { getAdminAnalytics, type AnalyticsData } from "@/lib/analytics.functions";
import { invalidateSubjectStatuses } from "@/lib/available-subjects";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import {
  Users, DollarSign, BookOpen, TrendingUp, Search, Plus, Edit3, Trash2,
  CheckCircle2, Crown, Activity, GraduationCap, Loader2, Upload, Download,
  Megaphone, Settings as SettingsIcon, Layers, Database, RotateCcw, FileText,
  Radio, ShieldAlert, Flag,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Papa from "papaparse";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة الإدارة — جو توجيهي" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const COLORS = ["hsl(var(--primary))", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  grade: string | null;
  field: string | null;
  subscription: string;
  created_at: string;
};
type SubjectRow = {
  id: string; name_ar: string; name_en: string; icon: string | null;
  grade: string; field: string | null; status: "available" | "locked" | "coming_soon";
  is_available: boolean;
};
type QuestionRow = {
  id: string; subject_id: string; question: string;
  options: string[]; correct_answer: number; explanation: string | null;
  passage: string | null; language: string;
  unit: number | null; bank_name: string | null;
};

function Admin() {
  const { loading, isAdmin, user } = useAuth();
  const [stats, setStats] = useState({ users: 0, attempts: 0, premium: 0, completionPct: 0 });

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const [{ count: u }, { count: a }, { count: p }, { data: attempts }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("user_attempts").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).neq("subscription", "free"),
        supabase.from("user_attempts").select("score, total"),
      ]);
      const rows = attempts ?? [];
      const completionPct = rows.length
        ? Math.round(rows.reduce((s, r: { score: number; total: number }) => s + (r.total > 0 ? (r.score / r.total) * 100 : 0), 0) / rows.length)
        : 0;
      setStats({ users: u ?? 0, attempts: a ?? 0, premium: p ?? 0, completionPct });
    })();
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" />;
  if (!isAdmin) return <Navigate to="/" />;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs">
              <Crown className="h-3 w-3 text-amber-500" /> نظام إدارة المحتوى
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">لوحة الإدارة الشاملة</h1>
            <p className="mt-1 text-sm text-muted-foreground">تحكّم كامل بالمنصّة — أسئلة، مواد، مستخدمين، إعلانات، وإعدادات</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={Users} label="إجمالي الطلاب" value={String(stats.users)} change={`+${stats.users}`} color="from-blue-500 to-indigo-600" />
          <Kpi icon={DollarSign} label="اشتراكات مدفوعة" value={String(stats.premium)} change="مباشر" color="from-emerald-500 to-teal-600" />
          <Kpi icon={BookOpen} label="امتحانات مكتملة" value={String(stats.attempts)} change="مباشر" color="from-amber-500 to-orange-600" />
          <Kpi icon={TrendingUp} label="متوسط النتيجة" value={`${stats.completionPct}%`} change="مباشر" color="from-purple-500 to-pink-600" />
        </div>

        <Tabs defaultValue="questions" className="mt-10">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 lg:grid-cols-10">
            <TabsTrigger value="questions"><FileText className="ml-1 h-3.5 w-3.5" />الأسئلة</TabsTrigger>
            <TabsTrigger value="exams"><BookOpen className="ml-1 h-3.5 w-3.5" />الامتحانات</TabsTrigger>
            <TabsTrigger value="subjects"><Layers className="ml-1 h-3.5 w-3.5" />المواد</TabsTrigger>
            <TabsTrigger value="users"><Users className="ml-1 h-3.5 w-3.5" />المستخدمون</TabsTrigger>
            <TabsTrigger value="live"><Radio className="ml-1 h-3.5 w-3.5" />المتصلون</TabsTrigger>
            <TabsTrigger value="moderation"><ShieldAlert className="ml-1 h-3.5 w-3.5" />الإشراف</TabsTrigger>
            <TabsTrigger value="announcements"><Megaphone className="ml-1 h-3.5 w-3.5" />الإعلانات</TabsTrigger>
            <TabsTrigger value="settings"><SettingsIcon className="ml-1 h-3.5 w-3.5" />الإعدادات</TabsTrigger>
            <TabsTrigger value="backup"><Database className="ml-1 h-3.5 w-3.5" />النسخ الاحتياطي</TabsTrigger>
            <TabsTrigger value="analytics"><Activity className="ml-1 h-3.5 w-3.5" />تحليلات</TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="mt-6"><ExamsTab /></TabsContent>
          <TabsContent value="exams" className="mt-6"><ExamsManagerTab /></TabsContent>
          <TabsContent value="subjects" className="mt-6"><SubjectsTab /></TabsContent>
          <TabsContent value="users" className="mt-6"><UsersTab /></TabsContent>
          <TabsContent value="live" className="mt-6"><LiveStatusTab /></TabsContent>
          <TabsContent value="moderation" className="mt-6"><ModerationTab /></TabsContent>
          <TabsContent value="announcements" className="mt-6"><AnnouncementsTab /></TabsContent>
          <TabsContent value="settings" className="mt-6"><SettingsTab /></TabsContent>
          <TabsContent value="backup" className="mt-6"><BackupTab /></TabsContent>
          <TabsContent value="analytics" className="mt-6"><AnalyticsTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, change, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; change: string; color: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="mt-2 text-2xl font-black">{value}</div>
          <div className="mt-1 text-xs font-semibold text-emerald-600">{change}</div>
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${color} text-white`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   USERS TAB — with progress reset, admin toggle, subscription control
   ======================================================================= */
function UsersTab() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [adminIds, setAdminIds] = useState<Set<string>>(new Set());
  const [teacherIds, setTeacherIds] = useState<Set<string>>(new Set());
  const [attemptCounts, setAttemptCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ProfileRow | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }, { data: attempts }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("user_attempts").select("user_id"),
    ]);
    setRows((profiles ?? []) as ProfileRow[]);
    setAdminIds(new Set((roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id)));
    setTeacherIds(new Set((roles ?? []).filter((r) => r.role === "teacher").map((r) => r.user_id)));
    const counts = new Map<string, number>();
    for (const a of attempts ?? []) counts.set(a.user_id, (counts.get(a.user_id) ?? 0) + 1);
    setAttemptCounts(counts);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = rows.filter((u) =>
    (u.full_name ?? "").toLowerCase().includes(q.toLowerCase()) ||
    (u.email ?? "").toLowerCase().includes(q.toLowerCase())
  );

  const toggleRole = async (userId: string, role: "admin" | "teacher", enable: boolean) => {
    if (enable) {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) return toast.error(error.message);
      toast.success("تمت الترقية");
    } else {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) return toast.error(error.message);
      toast.success("تم إلغاء الترقية");
    }
    load();
  };

  const changeSubscription = async (userId: string, sub: string) => {
    const { error } = await supabase.from("profiles").update({ subscription: sub as "free" | "premium" | "pro" }).eq("id", userId);
    if (error) return toast.error(error.message);
    toast.success("تم تحديث الاشتراك");
    load();
  };

  const resetProgress = async (userId: string, name: string) => {
    if (!confirm(`حذف جميع محاولات الطالب "${name}"؟ لا يمكن التراجع.`)) return;
    const { error } = await supabase.from("user_attempts").delete().eq("user_id", userId);
    if (error) return toast.error(error.message);
    toast.success("تم إعادة ضبط التقدم");
    load();
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-4">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="ابحث بالاسم أو البريد..." value={q} onChange={(e) => setQ(e.target.value)} className="pr-10" />
        </div>
        <div className="text-xs text-muted-foreground">{filtered.length} مستخدم</div>
      </div>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="grid place-items-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-right">
            <tr>
              <th className="p-3 font-semibold">الاسم</th>
              <th className="p-3 font-semibold">الصف / الحقل</th>
              <th className="p-3 font-semibold">محاولات</th>
              <th className="p-3 font-semibold">الاشتراك</th>
              <th className="p-3 font-semibold">الدور</th>
              <th className="p-3 text-left font-semibold">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const isAdmin = adminIds.has(u.id);
              const isTeacher = teacherIds.has(u.id);
              const attempts = attemptCounts.get(u.id) ?? 0;
              return (
              <tr key={u.id} className="border-t border-border/40 hover:bg-muted/20">
                <td className="p-3">
                  <div className="font-semibold">{u.full_name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </td>
                <td className="p-3 text-xs">
                  {u.grade === "12" ? `توجيهي — ${grade12Fields.find((f) => f.id === u.field)?.nameAr ?? u.field ?? ""}` : u.grade === "11" ? "أول ثانوي" : "—"}
                </td>
                <td className="p-3 text-xs">{attempts}</td>
                <td className="p-3">
                  <select value={u.subscription} onChange={(e) => changeSubscription(u.id, e.target.value)}
                    className="rounded-md border border-border/60 bg-background px-2 py-1 text-xs">
                    <option value="free">Free</option>
                    <option value="premium">Premium</option>
                    <option value="pro">Pro</option>
                  </select>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {isAdmin && <Badge className="bg-amber-500/20 text-amber-700"><Crown className="ml-1 h-3 w-3" />Admin</Badge>}
                    {isTeacher && <Badge className="bg-blue-500/20 text-blue-700"><GraduationCap className="ml-1 h-3 w-3" />معلم</Badge>}
                    {!isAdmin && !isTeacher && <Badge variant="outline">طالب</Badge>}
                  </div>
                </td>
                <td className="p-3 text-left">
                  <div className="flex flex-wrap justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(u)} title="تعديل الملف">
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => resetProgress(u.id, u.full_name ?? u.email ?? "")} title="إعادة ضبط التقدم" disabled={attempts === 0}>
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleRole(u.id, "teacher", !isTeacher)} title="دور المعلم">
                      {isTeacher ? "إلغاء المعلم" : "معلم"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleRole(u.id, "admin", !isAdmin)} title="دور الأدمن">
                      {isAdmin ? "إلغاء الأدمن" : "ترقية"}
                    </Button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
        )}
      </div>
      {editing && <ProfileEditor user={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function ProfileEditor({ user, onClose, onSaved }: { user: ProfileRow; onClose: () => void; onSaved: () => void }) {
  const [fullName, setFullName] = useState(user.full_name ?? "");
  const [grade, setGrade] = useState(user.grade ?? "");
  const [field, setField] = useState(user.field ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const parts = fullName.trim().split(/\s+/);
    const first = parts[0] ?? null;
    const last = parts.length >= 2 ? parts[parts.length - 1] : null;
    const { error } = await supabase.from("profiles").update({
      full_name: fullName || null,
      first_name: first,
      last_name: last,
      grade: (grade || null) as "11" | "12" | null,
      field: field || null,
    }).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">تعديل ملف الطالب</h3>
        <p className="mt-1 text-xs text-muted-foreground">{user.email}</p>
        <div className="mt-4 space-y-3">
          <div><label className="text-xs font-semibold">الاسم الكامل</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
          <div><label className="text-xs font-semibold">الصف</label>
            <select value={grade} onChange={(e) => setGrade(e.target.value)}
              className="mt-1 w-full rounded-md border border-border/60 bg-background px-2 py-2 text-sm">
              <option value="">—</option>
              <option value="11">الأول ثانوي</option>
              <option value="12">التوجيهي</option>
            </select></div>
          {grade === "12" && <div><label className="text-xs font-semibold">الحقل</label>
            <select value={field} onChange={(e) => setField(e.target.value)}
              className="mt-1 w-full rounded-md border border-border/60 bg-background px-2 py-2 text-sm">
              <option value="">—</option>
              {grade12Fields.map((f) => <option key={f.id} value={f.id}>{f.nameAr}</option>)}
            </select></div>}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={save} disabled={saving}>{saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}حفظ</Button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   SUBJECTS TAB — three-state availability toggle + CRUD
   ======================================================================= */
function SubjectsTab() {
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<SubjectRow | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("subjects").select("*").order("grade").order("field").order("id");
    setSubjects((data ?? []) as unknown as SubjectRow[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: SubjectRow["status"]) => {
    const { error } = await supabase.from("subjects").update({
      status,
      is_available: status === "available",
    }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم التحديث");
    invalidateSubjectStatuses();
    load();
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`حذف المادة "${name}"؟ سيتم حذف جميع أسئلتها ومحاولاتها. لا يمكن التراجع.`)) return;
    const { error } = await supabase.from("subjects").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف");
    invalidateSubjectStatuses();
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">المواد الدراسية</h3>
          <p className="text-xs text-muted-foreground">تحكم كامل بالمواد وحالتها — متاح / مقفل (Pro) / قريباً</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="ml-1 h-4 w-4" />مادة جديدة</Button>
      </div>

      {loading ? (
        <div className="grid place-items-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {subjects.map((s) => (
            <div key={s.id} className="rounded-xl border border-border/60 bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{s.icon}</span>
                    <div>
                      <div className="font-bold">{s.name_ar}</div>
                      <div className="text-xs text-muted-foreground">{s.name_en} • {s.grade === "12" ? "توجيهي" : "أول ثانوي"}{s.field ? ` • ${s.field}` : ""}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <select value={s.status} onChange={(e) => updateStatus(s.id, e.target.value as SubjectRow["status"])}
                      className="rounded-md border border-border/60 bg-background px-2 py-1 text-xs font-semibold">
                      <option value="available">✅ متاح</option>
                      <option value="locked">🔒 مقفل (Pro)</option>
                      <option value="coming_soon">⏳ قريباً</option>
                    </select>
                    <StatusBadge status={s.status} />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(s)}><Edit3 className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(s.id, s.name_ar)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <SubjectEditor
          subject={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { setCreating(false); setEditing(null); invalidateSubjectStatuses(); load(); }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: SubjectRow["status"] }) {
  if (status === "available") return <Badge className="bg-emerald-500/20 text-emerald-700">متاح</Badge>;
  if (status === "locked") return <Badge className="bg-amber-500/20 text-amber-700">Pro</Badge>;
  return <Badge className="bg-slate-500/20 text-slate-700">قريباً</Badge>;
}

function SubjectEditor({ subject, onClose, onSaved }: { subject: SubjectRow | null; onClose: () => void; onSaved: () => void }) {
  const [id, setId] = useState(subject?.id ?? "");
  const [nameAr, setNameAr] = useState(subject?.name_ar ?? "");
  const [nameEn, setNameEn] = useState(subject?.name_en ?? "");
  const [icon, setIcon] = useState(subject?.icon ?? "📘");
  const [grade, setGrade] = useState(subject?.grade ?? "11");
  const [field, setField] = useState(subject?.field ?? "");
  const [status, setStatus] = useState<SubjectRow["status"]>(subject?.status ?? "coming_soon");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!id.trim() || !nameAr.trim() || !nameEn.trim()) return toast.error("املأ الحقول المطلوبة");
    setSaving(true);
    const payload = {
      id, name_ar: nameAr, name_en: nameEn, icon, grade: grade as "11" | "12",
      field: field || null, status, is_available: status === "available",
    };
    const { error } = subject
      ? await supabase.from("subjects").update(payload).eq("id", subject.id)
      : await supabase.from("subjects").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">{subject ? "تعديل مادة" : "مادة جديدة"}</h3>
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold">المُعرِّف (id)</label>
              <Input value={id} onChange={(e) => setId(e.target.value)} placeholder="مثل: eng-math" disabled={!!subject} /></div>
            <div><label className="text-xs font-semibold">الأيقونة</label>
              <Input value={icon} onChange={(e) => setIcon(e.target.value)} /></div>
          </div>
          <div><label className="text-xs font-semibold">الاسم بالعربي</label>
            <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} /></div>
          <div><label className="text-xs font-semibold">الاسم بالإنجليزي</label>
            <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} dir="ltr" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold">الصف</label>
              <select value={grade} onChange={(e) => setGrade(e.target.value)}
                className="mt-1 w-full rounded-md border border-border/60 bg-background px-2 py-2 text-sm">
                <option value="11">الأول ثانوي</option>
                <option value="12">التوجيهي</option>
              </select></div>
            <div><label className="text-xs font-semibold">الحقل (توجيهي)</label>
              <select value={field} onChange={(e) => setField(e.target.value)}
                className="mt-1 w-full rounded-md border border-border/60 bg-background px-2 py-2 text-sm">
                <option value="">—</option>
                {grade12Fields.map((f) => <option key={f.id} value={f.id}>{f.nameAr}</option>)}
              </select></div>
          </div>
          <div><label className="text-xs font-semibold">الحالة</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as SubjectRow["status"])}
              className="mt-1 w-full rounded-md border border-border/60 bg-background px-2 py-2 text-sm">
              <option value="available">✅ متاح</option>
              <option value="locked">🔒 مقفل (Pro)</option>
              <option value="coming_soon">⏳ قريباً</option>
            </select></div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={save} disabled={saving}>{saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}حفظ</Button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   QUESTIONS / EXAMS TAB — with bulk CSV/XLSX upload
   ======================================================================= */
function ExamsTab() {
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<QuestionRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [showBulk, setShowBulk] = useState(false);

  const loadSubjects = async () => {
    const { data } = await supabase.from("subjects").select("*").order("id");
    const list = (data ?? []) as unknown as SubjectRow[];
    setSubjects(list);
    if (list.length && !selected) setSelected(list[0].id);
  };
  const loadQuestions = async (subjectId: string) => {
    const { data } = await supabase.from("questions").select("*").eq("subject_id", subjectId).order("created_at");
    setQuestions((data ?? []).map((r) => ({
      ...r,
      options: Array.isArray(r.options) ? (r.options as string[]) : JSON.parse(r.options as unknown as string),
    })) as QuestionRow[]);
  };
  useEffect(() => { loadSubjects(); }, []);
  useEffect(() => { if (selected) loadQuestions(selected); }, [selected]);

  const currentSubject = subjects.find((s) => s.id === selected);

  const deleteQuestion = async (id: string) => {
    if (!confirm("حذف السؤال؟")) return;
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف");
    if (selected) loadQuestions(selected);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="rounded-2xl border border-border/60 bg-card p-3">
        <div className="mb-2 flex items-center justify-between px-2">
          <div className="text-sm font-bold">المواد ({subjects.length})</div>
        </div>
        <div className="max-h-[600px] space-y-1 overflow-y-auto">
          {subjects.map((s) => (
            <button key={s.id} onClick={() => setSelected(s.id)}
              className={`flex w-full items-center gap-2 rounded-lg p-2 text-right text-sm transition ${
                selected === s.id ? "bg-primary/10 font-semibold text-primary" : "hover:bg-muted"
              }`}>
              <span className="text-lg">{s.icon}</span>
              <span className="min-w-0 flex-1 truncate">{s.name_ar}</span>
              <span className="text-xs text-muted-foreground">{s.grade}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6">
        {currentSubject && (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-4xl">{currentSubject.icon}</div>
                <h3 className="mt-2 text-2xl font-black">{currentSubject.name_ar}</h3>
                <p className="text-sm text-muted-foreground">{currentSubject.name_en} • {questions.length} سؤال</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowBulk(true)}><Upload className="ml-1 h-4 w-4" />رفع مجمّع</Button>
                <Button size="sm" onClick={() => setCreating(true)}><Plus className="ml-1 h-4 w-4" />سؤال جديد</Button>
              </div>
            </div>

            {showBulk && <BulkUpload subjectId={currentSubject.id} onClose={() => setShowBulk(false)} onDone={() => { setShowBulk(false); loadQuestions(currentSubject.id); }} />}

            {(creating || editing) && (
              <QuestionEditor
                subjectId={currentSubject.id}
                question={editing}
                onClose={() => { setEditing(null); setCreating(false); }}
                onSaved={() => { setEditing(null); setCreating(false); loadQuestions(currentSubject.id); }}
              />
            )}

            <div className="mt-6 space-y-3">
              {questions.map((q, i) => (
                <div key={q.id} className="rounded-xl border border-border/40 bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-muted-foreground">سؤال {i + 1}</div>
                      {q.passage && (
                        <div className="mt-2 rounded-md bg-muted/40 p-2 text-xs italic" dir={q.language === "en" ? "ltr" : "rtl"}>
                          {q.passage.slice(0, 200)}{q.passage.length > 200 ? "..." : ""}
                        </div>
                      )}
                      <p className="mt-1 font-semibold">{q.question}</p>
                      <div className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
                        {q.options.map((o, idx) => (
                          <div key={idx} className={`rounded px-2 py-1 ${idx === q.correct_answer ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted/50"}`}>
                            {["أ", "ب", "ج", "د"][idx]}) {o}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 flex-col gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(q)}><Edit3 className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteQuestion(q.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </div>
              ))}
              {!questions.length && <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">لا توجد أسئلة بعد لهذه المادة.</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function QuestionEditor({ subjectId, question, onClose, onSaved }: {
  subjectId: string;
  question: QuestionRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [text, setText] = useState(question?.question ?? "");
  const [options, setOptions] = useState<string[]>(question?.options ?? ["", "", "", ""]);
  const [correct, setCorrect] = useState(question?.correct_answer ?? 0);
  const [explanation, setExplanation] = useState(question?.explanation ?? "");
  const [passage, setPassage] = useState(question?.passage ?? "");
  const [language, setLanguage] = useState<string>(question?.language ?? "ar");
  const [unit, setUnit] = useState<string>(question?.unit != null ? String(question.unit) : "");
  const [bankName, setBankName] = useState<string>(question?.bank_name ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!text.trim() || options.some((o) => !o.trim())) return toast.error("املأ جميع الحقول");
    setSaving(true);
    const unitNum = unit.trim() ? Number(unit) : null;
    const payload = {
      subject_id: subjectId,
      question: text,
      options,
      correct_answer: correct,
      explanation,
      passage: passage.trim() ? passage : null,
      language,
      unit: unitNum && !Number.isNaN(unitNum) ? unitNum : null,
      bank_name: bankName.trim() || null,
    };
    const { error } = question
      ? await supabase.from("questions").update(payload).eq("id", question.id)
      : await supabase.from("questions").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ");
    onSaved();
  };

  return (
    <div className="mt-6 rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-bold">{question ? "تعديل سؤال" : "سؤال جديد"}</h4>
        <Button size="sm" variant="ghost" onClick={onClose}>إلغاء</Button>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs">
          <label className="font-semibold">اللغة:</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}
            className="rounded-md border border-border/60 bg-background px-2 py-1">
            <option value="ar">العربية (RTL)</option>
            <option value="en">English (LTR)</option>
          </select>
        </div>
        <textarea placeholder="نص القطعة / Passage (اختياري)" value={passage} onChange={(e) => setPassage(e.target.value)}
          rows={5} dir={language === "en" ? "ltr" : "rtl"}
          className="w-full rounded-md border border-border/60 bg-background p-2 text-sm" />
        <textarea placeholder="نص السؤال / Question" value={text} onChange={(e) => setText(e.target.value)}
          rows={2} dir={language === "en" ? "ltr" : "rtl"}
          className="w-full rounded-md border border-border/60 bg-background p-2 text-sm" />
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name="correct" checked={correct === i} onChange={() => setCorrect(i)} />
              <Input placeholder={language === "en" ? ["A", "B", "C", "D"][i] : ["أ", "ب", "ج", "د"][i]} value={o}
                dir={language === "en" ? "ltr" : "rtl"}
                onChange={(e) => setOptions(options.map((x, j) => j === i ? e.target.value : x))} />
            </div>
          ))}
        </div>
        <Input placeholder="التفسير / Explanation (اختياري)" value={explanation} onChange={(e) => setExplanation(e.target.value)} />
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold">الوحدة (1–9)</label>
            <select value={unit} onChange={(e) => setUnit(e.target.value)}
              className="mt-1 w-full rounded-md border border-border/60 bg-background px-2 py-2 text-sm">
              <option value="">— بدون وحدة —</option>
              {[1,2,3,4,5,6,7,8,9].map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold">اسم بنك الأسئلة (اختياري)</label>
            <Input placeholder="مثال: بنك 2024" value={bankName} onChange={(e) => setBankName(e.target.value)} />
          </div>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />} حفظ
        </Button>
      </div>
    </div>
  );
}

/* =========================================================================
   BULK UPLOAD — CSV & XLSX
   Expected columns: question, option_a, option_b, option_c, option_d,
   correct_answer (1-4 or a/b/c/d), explanation, passage, language
   ======================================================================= */
type BulkRow = Record<string, string | number | undefined>;

function BulkUpload({ subjectId, onClose, onDone }: { subjectId: string; onClose: () => void; onDone: () => void }) {
  const [rows, setRows] = useState<BulkRow[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<{ ok: number; errors: string[] } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = (kind: "csv" | "xlsx") => {
    const header = ["question", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation", "passage", "language", "unit", "bank_name"];
    const sample = [
      "ما هي عاصمة الأردن؟", "عمّان", "إربد", "الزرقاء", "العقبة", "1",
      "عمّان هي العاصمة السياسية والاقتصادية للأردن.", "", "ar", "1", "بنك 2024",
    ];
    if (kind === "csv") {
      const csv = Papa.unparse([header, sample]);
      downloadFile("questions-template.csv", "\uFEFF" + csv, "text/csv;charset=utf-8");
    } else {
      const ws = XLSX.utils.aoa_to_sheet([header, sample]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Questions");
      const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
      downloadFile("questions-template.xlsx", new Blob([buf]), "application/octet-stream");
    }
  };

  const handleFile = async (file: File) => {
    setPreview(null);
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => setRows(res.data as BulkRow[]),
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<BulkRow>(ws, { defval: "" });
      setRows(json);
    } else {
      toast.error("صيغة غير مدعومة. استخدم CSV أو XLSX.");
    }
  };

  const parseCorrect = (v: string | number | undefined): number => {
    const s = String(v ?? "").trim().toLowerCase();
    if (["1", "a", "أ"].includes(s)) return 0;
    if (["2", "b", "ب"].includes(s)) return 1;
    if (["3", "c", "ج"].includes(s)) return 2;
    if (["4", "d", "د"].includes(s)) return 3;
    return -1;
  };

  const upload = async () => {
    if (!rows) return;
    setUploading(true);
    const errors: string[] = [];
    const payload: {
      subject_id: string; question: string; options: string[];
      correct_answer: number; explanation: string | null;
      passage: string | null; language: string;
      unit: number | null; bank_name: string | null;
    }[] = [];
    rows.forEach((r, i) => {
      const q = String(r.question ?? "").trim();
      const a = String(r.option_a ?? "").trim();
      const b = String(r.option_b ?? "").trim();
      const c = String(r.option_c ?? "").trim();
      const d = String(r.option_d ?? "").trim();
      const correct = parseCorrect(r.correct_answer);
      if (!q || !a || !b || !c || !d) { errors.push(`صف ${i + 2}: حقول ناقصة`); return; }
      if (correct < 0) { errors.push(`صف ${i + 2}: correct_answer غير صالح (استخدم 1-4 أو a-d)`); return; }
      const unitRaw = String(r.unit ?? "").trim();
      const unitNum = unitRaw ? Number(unitRaw) : NaN;
      payload.push({
        subject_id: subjectId,
        question: q,
        options: [a, b, c, d],
        correct_answer: correct,
        explanation: String(r.explanation ?? "").trim() || null,
        passage: String(r.passage ?? "").trim() || null,
        language: String(r.language ?? "ar").trim() || "ar",
        unit: !Number.isNaN(unitNum) && unitNum >= 1 && unitNum <= 9 ? unitNum : null,
        bank_name: String(r.bank_name ?? "").trim() || null,
      });
    });

    if (!payload.length) {
      setUploading(false);
      setPreview({ ok: 0, errors });
      return;
    }
    const { error } = await supabase.from("questions").insert(payload);
    setUploading(false);
    if (error) return toast.error(error.message);
    setPreview({ ok: payload.length, errors });
    toast.success(`تم رفع ${payload.length} سؤال`);
    if (!errors.length) setTimeout(onDone, 800);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">رفع أسئلة مجمّع</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>إغلاق</Button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">حمّل قالبًا، املأه، ثم ارفعه. الأعمدة: question, option_a-d, correct_answer (1-4 أو a-d), explanation, passage, language (ar/en), unit (1-9)، bank_name.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => downloadTemplate("csv")}><Download className="ml-1 h-4 w-4" />قالب CSV</Button>
          <Button size="sm" variant="outline" onClick={() => downloadTemplate("xlsx")}><Download className="ml-1 h-4 w-4" />قالب Excel</Button>
        </div>

        <div className="mt-4 rounded-xl border-2 border-dashed border-border p-6 text-center">
          <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
          <div className="mt-2 text-sm">{rows ? `${rows.length} صف جاهز` : "اسحب الملف أو انقر للاختيار"}</div>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => inputRef.current?.click()}>اختر ملف</Button>
        </div>

        {rows && rows.length > 0 && (
          <div className="mt-4 max-h-40 overflow-auto rounded-lg border border-border/60 bg-muted/20 p-2 text-xs">
            {rows.slice(0, 5).map((r, i) => (
              <div key={i} className="border-b border-border/40 py-1 last:border-0">
                <span className="font-semibold">{i + 1}.</span> {String(r.question ?? "").slice(0, 80)}...
              </div>
            ))}
            {rows.length > 5 && <div className="pt-1 text-muted-foreground">+{rows.length - 5} أخرى</div>}
          </div>
        )}

        {preview && (
          <div className="mt-4 rounded-lg border border-border/60 p-3 text-xs">
            <div className="font-semibold text-emerald-600">تم إدخال {preview.ok} سؤال بنجاح.</div>
            {preview.errors.length > 0 && (
              <div className="mt-2 space-y-1 text-destructive">
                {preview.errors.slice(0, 10).map((e, i) => <div key={i}>• {e}</div>)}
                {preview.errors.length > 10 && <div>+{preview.errors.length - 10} أخطاء أخرى</div>}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={upload} disabled={!rows || uploading}>
            {uploading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}رفع {rows?.length ?? 0} سؤال
          </Button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   ANNOUNCEMENTS TAB
   ======================================================================= */
type Announcement = { id: string; message: string; level: string; active: boolean; created_at: string };

function AnnouncementsTab() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [message, setMessage] = useState("");
  const [level, setLevel] = useState("info");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    setItems((data ?? []) as Announcement[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!message.trim()) return;
    const { error } = await supabase.from("announcements").insert({ message, level, active: true });
    if (error) return toast.error(error.message);
    toast.success("تم إضافة الإعلان");
    setMessage("");
    load();
  };

  const toggle = async (id: string, active: boolean) => {
    const { error } = await supabase.from("announcements").update({ active }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف الإعلان؟")) return;
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <h3 className="font-bold">إعلان جديد</h3>
        <p className="text-xs text-muted-foreground">يظهر كشريط أعلى الموقع لجميع الزوار.</p>
        <div className="mt-3 flex flex-wrap items-stretch gap-2">
          <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="اكتب رسالة الإعلان..." className="flex-1 min-w-[200px]" />
          <select value={level} onChange={(e) => setLevel(e.target.value)}
            className="rounded-md border border-border/60 bg-background px-3 text-sm">
            <option value="info">معلومة</option>
            <option value="success">نجاح</option>
            <option value="warning">تحذير</option>
            <option value="danger">تنبيه هام</option>
          </select>
          <Button onClick={add}><Plus className="ml-1 h-4 w-4" />إضافة</Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card">
        <div className="border-b border-border/60 p-4"><h3 className="font-bold">الإعلانات ({items.length})</h3></div>
        {loading ? <div className="grid place-items-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> :
          items.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">لا توجد إعلانات.</div> :
          <div className="divide-y divide-border/40">
            {items.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 p-4">
                <Badge variant="outline">{a.level}</Badge>
                <div className="min-w-0 flex-1">{a.message}</div>
                <Switch checked={a.active} onCheckedChange={(v) => toggle(a.id, v)} />
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
          </div>
        }
      </div>
    </div>
  );
}

/* =========================================================================
   SETTINGS TAB
   ======================================================================= */
type Branding = { site_name_ar?: string; site_name_en?: string; tagline_ar?: string; contact_email?: string; contact_phone?: string; whatsapp?: string };

function SettingsTab() {
  const [branding, setBranding] = useState<Branding>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "branding").maybeSingle();
      setBranding(((data?.value as Branding) ?? {}));
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("site_settings").upsert({ key: "branding", value: branding });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("تم حفظ الإعدادات");
  };

  const set = (k: keyof Branding, v: string) => setBranding((b) => ({ ...b, [k]: v }));

  if (loading) return <div className="grid place-items-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <h3 className="text-lg font-bold">إعدادات الموقع العامة</h3>
        <p className="text-xs text-muted-foreground">اسم الموقع، الشعار النصي، ومعلومات التواصل.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div><label className="text-xs font-semibold">اسم الموقع (عربي)</label>
            <Input value={branding.site_name_ar ?? ""} onChange={(e) => set("site_name_ar", e.target.value)} /></div>
          <div><label className="text-xs font-semibold">Site name (English)</label>
            <Input dir="ltr" value={branding.site_name_en ?? ""} onChange={(e) => set("site_name_en", e.target.value)} /></div>
          <div className="sm:col-span-2"><label className="text-xs font-semibold">الوصف / الشعار</label>
            <Input value={branding.tagline_ar ?? ""} onChange={(e) => set("tagline_ar", e.target.value)} /></div>
          <div><label className="text-xs font-semibold">البريد الإلكتروني</label>
            <Input dir="ltr" value={branding.contact_email ?? ""} onChange={(e) => set("contact_email", e.target.value)} /></div>
          <div><label className="text-xs font-semibold">هاتف</label>
            <Input dir="ltr" value={branding.contact_phone ?? ""} onChange={(e) => set("contact_phone", e.target.value)} /></div>
          <div className="sm:col-span-2"><label className="text-xs font-semibold">واتساب</label>
            <Input dir="ltr" value={branding.whatsapp ?? ""} onChange={(e) => set("whatsapp", e.target.value)} /></div>
        </div>
        <Button className="mt-5" onClick={save} disabled={saving}>
          {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}حفظ التغييرات
        </Button>
      </div>
    </div>
  );
}

/* =========================================================================
   BACKUP TAB
   ======================================================================= */
function BackupTab() {
  const [busy, setBusy] = useState<string | null>(null);

  const exportTable = async (table: "questions" | "profiles" | "subjects" | "user_attempts" | "announcements") => {
    setBusy(table);
    const { data, error } = await supabase.from(table).select("*");
    setBusy(null);
    if (error) return toast.error(error.message);
    const rows = data ?? [];
    if (!rows.length) return toast.error("لا توجد بيانات");
    const flat = rows.map((r) => {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(r)) {
        out[k] = typeof v === "object" && v !== null ? JSON.stringify(v) : v;
      }
      return out;
    });
    const csv = Papa.unparse(flat);
    downloadFile(`${table}-${new Date().toISOString().slice(0, 10)}.csv`, "\uFEFF" + csv, "text/csv;charset=utf-8");
    toast.success(`تم تصدير ${rows.length} صف`);
  };

  const exportAll = async () => {
    setBusy("all");
    const tables = ["questions", "profiles", "subjects", "user_attempts", "announcements"] as const;
    const wb = XLSX.utils.book_new();
    for (const t of tables) {
      const { data } = await supabase.from(t).select("*");
      const flat = (data ?? []).map((r) => {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(r)) out[k] = typeof v === "object" && v !== null ? JSON.stringify(v) : v;
        return out;
      });
      const ws = XLSX.utils.json_to_sheet(flat);
      XLSX.utils.book_append_sheet(wb, ws, t);
    }
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    downloadFile(`backup-${new Date().toISOString().slice(0, 10)}.xlsx`, new Blob([buf]), "application/octet-stream");
    setBusy(null);
    toast.success("تم إنشاء نسخة احتياطية شاملة");
  };

  const tables: { key: "questions" | "profiles" | "subjects" | "user_attempts" | "announcements"; label: string; desc: string }[] = [
    { key: "questions", label: "الأسئلة", desc: "جميع أسئلة الامتحانات مع الخيارات والتفسيرات" },
    { key: "subjects", label: "المواد", desc: "قائمة المواد وحالات التوفر" },
    { key: "profiles", label: "المستخدمون", desc: "بيانات الطلاب (بدون كلمات المرور)" },
    { key: "user_attempts", label: "محاولات الامتحانات", desc: "سجل جميع محاولات الطلاب" },
    { key: "announcements", label: "الإعلانات", desc: "سجل الإعلانات" },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">نسخة احتياطية شاملة</h3>
            <p className="text-sm text-muted-foreground">ملف Excel واحد يحوي جميع الجداول.</p>
          </div>
          <Button onClick={exportAll} disabled={busy === "all"}>
            {busy === "all" ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Database className="ml-2 h-4 w-4" />}
            تنزيل نسخة كاملة (.xlsx)
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {tables.map((t) => (
          <div key={t.key} className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-4">
            <div>
              <div className="font-bold">{t.label}</div>
              <div className="text-xs text-muted-foreground">{t.desc}</div>
            </div>
            <Button size="sm" variant="outline" onClick={() => exportTable(t.key)} disabled={busy === t.key}>
              {busy === t.key ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Download className="ml-2 h-4 w-4" />}
              CSV
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function downloadFile(name: string, data: string | Blob, mime: string) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* =========================================================================
   ANALYTICS
   ======================================================================= */
function AnalyticsTab() {
  const fetchAnalytics = useServerFn(getAdminAnalytics);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics()
      .then((d) => setData(d))
      .catch((e) => toast.error((e as Error)?.message ?? "تعذّر تحميل التحليلات"))
      .finally(() => setLoading(false));
  }, [fetchAnalytics]);

  if (loading || !data) {
    return <div className="grid place-items-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const hasSubjects = data.subjectPopularity.length > 0;
  const hasRevenue = data.monthlyRevenue.some((m) => m.revenue > 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="النشاط الأسبوعي" desc="طلاب جدد وامتحانات مكتملة — آخر 7 أيام">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data.weeklyActivity}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="day" fontSize={11} />
            <YAxis fontSize={11} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
            <Area type="monotone" dataKey="users" stroke="hsl(217, 91%, 60%)" fill="url(#g1)" name="طلاب جدد" />
            <Area type="monotone" dataKey="exams" stroke="#22c55e" fill="url(#g2)" name="امتحانات" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="المواد الأكثر شعبية" desc="عدد المحاولات لكل مادة">
        {hasSubjects ? (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={data.subjectPopularity} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e: { name: string }) => e.name}>
                {data.subjectPopularity.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="grid h-[280px] place-items-center text-sm text-muted-foreground">لا توجد محاولات بعد</div>
        )}
      </ChartCard>

      <ChartCard title="الإيرادات الشهرية" desc="بالدينار الأردني — آخر 6 أشهر">
        {hasRevenue ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="month" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="revenue" fill="hsl(217, 91%, 60%)" radius={[6, 6, 0, 0]} name="إيرادات (د.أ)" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="grid h-[280px] place-items-center text-sm text-muted-foreground">لا توجد إيرادات مسجّلة</div>
        )}
      </ChartCard>

      <ChartCard title="متوسط النتائج اليومي" desc="نسبة الإجابات الصحيحة — آخر 7 أيام">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data.weeklyActivity}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="day" fontSize={11} />
            <YAxis fontSize={11} domain={[0, 100]} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: number | string) => `${v}%`} />
            <Line type="monotone" dataKey="avgScore" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5 }} name="متوسط النتيجة %" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        <div>
          <h3 className="font-bold">{title}</h3>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

/* =========================================================================
   EXAMS MANAGER TAB — Create/edit exams and assign/order questions
   ======================================================================= */
type ExamRow = {
  id: string; subject_id: string; type: string;
  name_ar: string; name_en: string | null; description: string | null;
  year: number | null; duration_seconds: number; total_score: number;
  sort_order: number; active: boolean;
};

function ExamsManagerTab() {
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [editing, setEditing] = useState<ExamRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [managingQuestions, setManagingQuestions] = useState<ExamRow | null>(null);

  const loadSubjects = async () => {
    const { data } = await supabase.from("subjects").select("*").order("id");
    const list = (data ?? []) as unknown as SubjectRow[];
    setSubjects(list);
    if (list.length && !selectedSubject) setSelectedSubject(list[0].id);
  };
  const loadExams = async (subjectId: string) => {
    const { data } = await supabase.from("exams").select("*").eq("subject_id", subjectId).order("sort_order").order("year", { ascending: false });
    setExams((data ?? []) as ExamRow[]);
  };
  useEffect(() => { loadSubjects(); }, []);
  useEffect(() => { if (selectedSubject) loadExams(selectedSubject); }, [selectedSubject]);

  const deleteExam = async (id: string) => {
    if (!confirm("حذف الامتحان؟ سيتم حذف جميع أسئلته المُعيّنة أيضًا.")) return;
    await supabase.from("exam_questions").delete().eq("exam_id", id);
    const { error } = await supabase.from("exams").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف");
    if (selectedSubject) loadExams(selectedSubject);
  };

  const toggleActive = async (ex: ExamRow) => {
    const { error } = await supabase.from("exams").update({ active: !ex.active }).eq("id", ex.id);
    if (error) return toast.error(error.message);
    if (selectedSubject) loadExams(selectedSubject);
  };

  const current = subjects.find((s) => s.id === selectedSubject);

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="rounded-2xl border border-border/60 bg-card p-3">
        <div className="mb-2 flex items-center justify-between px-2">
          <div className="text-sm font-bold">المواد ({subjects.length})</div>
        </div>
        <div className="max-h-[600px] space-y-1 overflow-y-auto">
          {subjects.map((s) => (
            <button key={s.id} onClick={() => setSelectedSubject(s.id)}
              className={`flex w-full items-center gap-2 rounded-lg p-2 text-right text-sm transition ${
                selectedSubject === s.id ? "bg-primary/10 font-semibold text-primary" : "hover:bg-muted"
              }`}>
              <span className="text-lg">{s.icon}</span>
              <span className="min-w-0 flex-1 truncate">{s.name_ar}</span>
              <span className="text-xs text-muted-foreground">{s.grade}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6">
        {current && (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-black">{current.name_ar}</h3>
                <p className="text-sm text-muted-foreground">{exams.length} امتحان</p>
              </div>
              <Button size="sm" onClick={() => setCreating(true)}><Plus className="ml-1 h-4 w-4" />امتحان جديد</Button>
            </div>

            {(creating || editing) && (
              <ExamEditor
                subjectId={current.id}
                exam={editing}
                onClose={() => { setEditing(null); setCreating(false); }}
                onSaved={() => { setEditing(null); setCreating(false); loadExams(current.id); }}
              />
            )}

            {managingQuestions && (
              <ExamQuestionsManager
                exam={managingQuestions}
                onClose={() => setManagingQuestions(null)}
              />
            )}

            <div className="mt-6 space-y-3">
              {exams.map((ex) => (
                <div key={ex.id} className="rounded-xl border border-border/40 bg-background p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          ex.type === "ministerial" ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" :
                          ex.type === "bank" ? "bg-blue-500/20 text-blue-700 dark:text-blue-300" :
                          "bg-muted"
                        }`}>{ex.type}</span>
                        {ex.year && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold">{ex.year}</span>}
                        {!ex.active && <span className="rounded-full bg-destructive/20 px-2 py-0.5 text-[10px] font-bold text-destructive">معطّل</span>}
                      </div>
                      <h4 className="mt-1 font-bold">{ex.name_ar}</h4>
                      {ex.description && <p className="text-xs text-muted-foreground">{ex.description}</p>}
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>⏱ {Math.round(ex.duration_seconds / 60)} د</span>
                        <span>🏆 {ex.total_score} علامة</span>
                        <span>ترتيب: {ex.sort_order}</span>
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 flex-wrap gap-1">
                      <Button size="sm" variant="outline" onClick={() => setManagingQuestions(ex)}><FileText className="ml-1 h-3.5 w-3.5" />الأسئلة</Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleActive(ex)}>{ex.active ? "تعطيل" : "تفعيل"}</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(ex)}><Edit3 className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteExam(ex.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </div>
              ))}
              {!exams.length && <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">لا توجد امتحانات لهذه المادة بعد. أضف امتحاناً جديداً.</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ExamEditor({ subjectId, exam, onClose, onSaved }: {
  subjectId: string;
  exam: ExamRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState(exam?.type ?? "ministerial");
  const [nameAr, setNameAr] = useState(exam?.name_ar ?? "");
  const [nameEn, setNameEn] = useState(exam?.name_en ?? "");
  const [description, setDescription] = useState(exam?.description ?? "");
  const [year, setYear] = useState<string>(exam?.year ? String(exam.year) : "");
  const [durationMin, setDurationMin] = useState<string>(String(Math.round((exam?.duration_seconds ?? 3600) / 60)));
  const [totalScore, setTotalScore] = useState<string>(String(exam?.total_score ?? 100));
  const [sortOrder, setSortOrder] = useState<string>(String(exam?.sort_order ?? 0));
  const [active, setActive] = useState<boolean>(exam?.active ?? true);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!nameAr.trim()) return toast.error("أدخل اسم الامتحان");
    setSaving(true);
    const payload = {
      subject_id: subjectId,
      type,
      name_ar: nameAr,
      name_en: nameEn.trim() || null,
      description: description.trim() || null,
      year: year.trim() ? Number(year) : null,
      duration_seconds: Math.max(60, Number(durationMin) * 60),
      total_score: Number(totalScore),
      sort_order: Number(sortOrder) || 0,
      active,
    };
    const { error } = exam
      ? await supabase.from("exams").update(payload).eq("id", exam.id)
      : await supabase.from("exams").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ");
    onSaved();
  };

  return (
    <div className="mt-6 rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-bold">{exam ? "تعديل امتحان" : "امتحان جديد"}</h4>
        <Button size="sm" variant="ghost" onClick={onClose}>إلغاء</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold">النوع</label>
          <select value={type} onChange={(e) => setType(e.target.value)}
            className="mt-1 w-full rounded-md border border-border/60 bg-background px-2 py-2 text-sm">
            <option value="ministerial">وزاري (Ministerial)</option>
            <option value="bank">بنك أسئلة (Bank)</option>
            <option value="custom">مخصّص (Custom)</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold">السنة</label>
          <Input type="number" placeholder="2024" value={year} onChange={(e) => setYear(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold">الاسم بالعربية</label>
          <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold">Name (English)</label>
          <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold">الوصف</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            className="w-full rounded-md border border-border/60 bg-background p-2 text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold">المدة (دقيقة)</label>
          <Input type="number" value={durationMin} onChange={(e) => setDurationMin(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold">العلامة الكلية</label>
          <Input type="number" value={totalScore} onChange={(e) => setTotalScore(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold">ترتيب العرض</label>
          <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
        </div>
        <div className="flex items-end gap-2">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            نشط ومرئي للطلاب
          </label>
        </div>
      </div>
      <Button className="mt-4" onClick={save} disabled={saving}>
        {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />} حفظ الامتحان
      </Button>
    </div>
  );
}

function ExamQuestionsManager({ exam, onClose }: { exam: ExamRow; onClose: () => void }) {
  const [allQuestions, setAllQuestions] = useState<QuestionRow[]>([]);
  const [assigned, setAssigned] = useState<{ question_id: string; order_index: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: qs }, { data: eq }] = await Promise.all([
      supabase.from("questions").select("*").eq("subject_id", exam.subject_id).order("created_at"),
      supabase.from("exam_questions").select("question_id, order_index").eq("exam_id", exam.id).order("order_index"),
    ]);
    setAllQuestions(((qs ?? []) as unknown as QuestionRow[]).map((r) => ({
      ...r,
      options: Array.isArray(r.options) ? r.options : JSON.parse(r.options as unknown as string),
    })));
    setAssigned((eq ?? []) as { question_id: string; order_index: number }[]);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [exam.id]);

  const isAssigned = (id: string) => assigned.some((a) => a.question_id === id);
  const toggle = (id: string) => {
    if (isAssigned(id)) {
      setAssigned(assigned.filter((a) => a.question_id !== id).map((a, i) => ({ ...a, order_index: i })));
    } else {
      setAssigned([...assigned, { question_id: id, order_index: assigned.length }]);
    }
  };
  const move = (idx: number, dir: -1 | 1) => {
    const next = [...assigned];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setAssigned(next.map((a, i) => ({ ...a, order_index: i })));
  };

  const saveAll = async () => {
    setSaving(true);
    await supabase.from("exam_questions").delete().eq("exam_id", exam.id);
    if (assigned.length) {
      const { error } = await supabase.from("exam_questions").insert(
        assigned.map((a, i) => ({ exam_id: exam.id, question_id: a.question_id, order_index: i })),
      );
      if (error) { setSaving(false); return toast.error(error.message); }
    }
    setSaving(false);
    toast.success(`تم حفظ ${assigned.length} سؤال في الامتحان`);
    onClose();
  };

  const filtered = allQuestions.filter((q) => !search.trim() || q.question.toLowerCase().includes(search.toLowerCase()));
  const assignedQs = assigned
    .map((a) => ({ a, q: allQuestions.find((x) => x.id === a.question_id) }))
    .filter((x) => x.q) as { a: { question_id: string; order_index: number }; q: QuestionRow }[];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-5xl rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">إدارة أسئلة: {exam.name_ar}</h3>
            <p className="text-xs text-muted-foreground">اختر الأسئلة ورتّبها. سيتم حفظها عند الضغط على "حفظ".</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>إغلاق</Button>
        </div>

        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-bold">جميع الأسئلة ({filtered.length})</div>
                <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 w-40" />
              </div>
              <div className="max-h-[500px] space-y-2 overflow-y-auto rounded-lg border border-border/60 p-2">
                {filtered.map((q) => {
                  const on = isAssigned(q.id);
                  return (
                    <label key={q.id} className={`flex cursor-pointer items-start gap-2 rounded-md p-2 text-xs transition ${on ? "bg-primary/10" : "hover:bg-muted"}`}>
                      <input type="checkbox" checked={on} onChange={() => toggle(q.id)} className="mt-0.5" />
                      <div className="flex-1">
                        <div className="line-clamp-2">{q.question}</div>
                        <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                          {q.unit != null && <span className="rounded bg-muted px-1.5 py-0.5">وحدة {q.unit}</span>}
                          {q.bank_name && <span className="rounded bg-muted px-1.5 py-0.5">{q.bank_name}</span>}
                        </div>
                      </div>
                    </label>
                  );
                })}
                {!filtered.length && <div className="p-4 text-center text-xs text-muted-foreground">لا نتائج</div>}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-bold">أسئلة الامتحان ({assignedQs.length})</div>
              <div className="max-h-[500px] space-y-2 overflow-y-auto rounded-lg border border-border/60 p-2">
                {assignedQs.map(({ q }, idx) => (
                  <div key={q.id} className="flex items-start gap-2 rounded-md bg-background p-2 text-xs">
                    <div className="font-bold text-primary">{idx + 1}.</div>
                    <div className="flex-1 line-clamp-2">{q.question}</div>
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => move(idx, -1)} className="rounded bg-muted px-1 hover:bg-muted-foreground/20" disabled={idx === 0}>↑</button>
                      <button onClick={() => move(idx, 1)} className="rounded bg-muted px-1 hover:bg-muted-foreground/20" disabled={idx === assignedQs.length - 1}>↓</button>
                    </div>
                    <button onClick={() => toggle(q.id)} className="text-destructive hover:opacity-70"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
                {!assignedQs.length && <div className="p-4 text-center text-xs text-muted-foreground">لم يتم اختيار أي سؤال بعد</div>}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={saveAll} disabled={saving}>
            {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />} حفظ ({assigned.length})
          </Button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   LIVE STATUS TAB — currently online users (presence heartbeat within 2m)
   ======================================================================= */
function LiveStatusTab() {
  const [online, setOnline] = useState<Array<{ id: string; name: string; email: string | null; last_seen: string; role: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [totalToday, setTotalToday] = useState(0);

  const load = async () => {
    setLoading(true);
    const cutoff = new Date(Date.now() - 2 * 60_000).toISOString();
    const dayStart = new Date(Date.now() - 24 * 3600_000).toISOString();
    const [{ data: presence }, { data: profiles }, { data: roles }, { count: dayCount }] = await Promise.all([
      supabase.from("user_presence").select("user_id, last_seen").gte("last_seen", cutoff).order("last_seen", { ascending: false }),
      supabase.from("profiles").select("id, full_name, email"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("user_presence").select("*", { count: "exact", head: true }).gte("last_seen", dayStart),
    ]);
    const pMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    const rMap = new Map<string, string>();
    for (const r of roles ?? []) {
      const prev = rMap.get(r.user_id);
      if (r.role === "admin" || (!prev && r.role === "teacher")) rMap.set(r.user_id, r.role);
    }
    setOnline((presence ?? []).map((p) => {
      const prof = pMap.get(p.user_id);
      return {
        id: p.user_id,
        name: prof?.full_name ?? "طالب",
        email: prof?.email ?? null,
        last_seen: p.last_seen,
        role: rMap.get(p.user_id) ?? "student",
      };
    }));
    setTotalToday(dayCount ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 30_000);
    return () => clearInterval(iv);
  }, []);

  const timeAgo = (iso: string) => {
    const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (s < 60) return `قبل ${s} ثانية`;
    return `قبل ${Math.floor(s / 60)} دقيقة`;
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="text-xs text-muted-foreground">متصلون الآن</div>
          <div className="mt-2 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
            <span className="text-2xl font-black">{online.length}</span>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="text-xs text-muted-foreground">آخر 24 ساعة</div>
          <div className="mt-2 text-2xl font-black">{totalToday}</div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="text-xs text-muted-foreground">تحديث تلقائي</div>
          <div className="mt-2 text-sm">كل 30 ثانية</div>
          <Button size="sm" variant="outline" className="mt-2" onClick={load}><RotateCcw className="ml-1 h-3.5 w-3.5" />تحديث الآن</Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        {loading ? (
          <div className="grid place-items-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : online.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">لا يوجد مستخدمون متصلون الآن.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-right">
              <tr>
                <th className="p-3 font-semibold">المستخدم</th>
                <th className="p-3 font-semibold">الدور</th>
                <th className="p-3 font-semibold">آخر نشاط</th>
              </tr>
            </thead>
            <tbody>
              {online.map((u) => (
                <tr key={u.id} className="border-t border-border/40">
                  <td className="p-3">
                    <div className="font-semibold">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="p-3">
                    {u.role === "admin" ? <Badge className="bg-amber-500/20 text-amber-700"><Crown className="ml-1 h-3 w-3" />Admin</Badge>
                      : u.role === "teacher" ? <Badge className="bg-blue-500/20 text-blue-700"><GraduationCap className="ml-1 h-3 w-3" />معلم</Badge>
                      : <Badge variant="outline">طالب</Badge>}
                  </td>
                  <td className="p-3 text-xs text-emerald-600">{timeAgo(u.last_seen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   MODERATION TAB — review flagged posts/comments, resolve or dismiss
   ======================================================================= */
type ReportRow = {
  id: string;
  reporter_id: string;
  target_type: "post" | "comment";
  target_id: string;
  reason: string | null;
  status: "open" | "resolved" | "dismissed";
  created_at: string;
};

function ModerationTab() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [posts, setPosts] = useState<Map<string, { id: string; content: string; author_id: string }>>(new Map());
  const [comments, setComments] = useState<Map<string, { id: string; content: string; author_id: string; post_id: string }>>(new Map());
  const [profiles, setProfiles] = useState<Map<string, { id: string; full_name: string | null; email: string | null }>>(new Map());
  const [filter, setFilter] = useState<"open" | "resolved" | "dismissed" | "all">("open");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: rs } = await supabase.from("moderation_reports").select("*").order("created_at", { ascending: false });
    const reps = (rs ?? []) as ReportRow[];
    setReports(reps);

    const postIds = [...new Set(reps.filter((r) => r.target_type === "post").map((r) => r.target_id))];
    const commentIds = [...new Set(reps.filter((r) => r.target_type === "comment").map((r) => r.target_id))];

    const [{ data: p }, { data: c }] = await Promise.all([
      postIds.length ? supabase.from("teacher_posts").select("id, content, author_id").in("id", postIds) : Promise.resolve({ data: [] }),
      commentIds.length ? supabase.from("post_comments").select("id, content, author_id, post_id").in("id", commentIds) : Promise.resolve({ data: [] }),
    ]);
    setPosts(new Map((p ?? []).map((x) => [x.id, x])));
    setComments(new Map((c ?? []).map((x) => [x.id, x])));

    const uids = [...new Set([
      ...reps.map((r) => r.reporter_id),
      ...(p ?? []).map((x) => x.author_id),
      ...(c ?? []).map((x) => x.author_id),
    ])];
    if (uids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", uids);
      setProfiles(new Map((profs ?? []).map((x) => [x.id, x])));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: "resolved" | "dismissed") => {
    const { error } = await supabase.from("moderation_reports").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم التحديث");
    load();
  };

  const deleteTarget = async (r: ReportRow) => {
    if (!confirm(`حذف ${r.target_type === "post" ? "المنشور" : "التعليق"} نهائياً؟`)) return;
    const table = r.target_type === "post" ? "teacher_posts" : "post_comments";
    const { error } = await supabase.from(table).delete().eq("id", r.target_id);
    if (error) return toast.error(error.message);
    await supabase.from("moderation_reports").update({ status: "resolved" }).eq("id", r.id);
    toast.success("تم الحذف");
    load();
  };

  const filtered = reports.filter((r) => filter === "all" || r.status === filter);
  const counts = {
    open: reports.filter((r) => r.status === "open").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
    dismissed: reports.filter((r) => r.status === "dismissed").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["open", "resolved", "dismissed", "all"] as const).map((s) => (
          <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s)}>
            {s === "open" ? `مفتوحة (${counts.open})` : s === "resolved" ? `مُعالجة (${counts.resolved})` : s === "dismissed" ? `مرفوضة (${counts.dismissed})` : "الكل"}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="grid place-items-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card p-12 text-center text-sm text-muted-foreground">
          <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
          لا توجد بلاغات في هذه الفئة.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const reporter = profiles.get(r.reporter_id);
            const target = r.target_type === "post" ? posts.get(r.target_id) : comments.get(r.target_id);
            const author = target ? profiles.get(target.author_id) : null;
            return (
              <div key={r.id} className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge className="bg-red-500/15 text-red-700"><Flag className="ml-1 h-3 w-3" />{r.target_type === "post" ? "منشور" : "تعليق"}</Badge>
                      <Badge variant="outline">{r.status === "open" ? "مفتوح" : r.status === "resolved" ? "معالج" : "مرفوض"}</Badge>
                      <span className="text-muted-foreground">أُبلغ من: <span className="font-semibold text-foreground">{reporter?.full_name ?? reporter?.email ?? "—"}</span></span>
                      <span className="text-muted-foreground">{new Date(r.created_at).toLocaleString("ar")}</span>
                    </div>
                    {r.reason && <div className="mt-2 rounded-lg bg-muted/40 p-3 text-sm"><span className="text-xs font-bold text-muted-foreground">السبب:</span> {r.reason}</div>}
                    <div className="mt-3 rounded-xl border border-border/40 bg-background p-3">
                      <div className="mb-1 text-xs text-muted-foreground">
                        {target ? <>بواسطة {author?.full_name ?? author?.email ?? "—"}</> : "المحتوى محذوف"}
                      </div>
                      <div className="text-sm whitespace-pre-wrap break-words">{target?.content ?? "—"}</div>
                    </div>
                  </div>
                </div>
                {r.status === "open" && (
                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "dismissed")}>رفض البلاغ</Button>
                    <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "resolved")}>وضع كمعالج</Button>
                    {target && <Button size="sm" variant="destructive" onClick={() => deleteTarget(r)}><Trash2 className="ml-1 h-3.5 w-3.5" />حذف المحتوى</Button>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
